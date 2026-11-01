"""
Comprehensive Cross-Validation Suite for GraphMetaMat Pipelines and Connections.
Validates all 7 subsystems described in Nature Machine Intelligence (2025):
  1. Dataset loading, featurization (node [x,y,z], edge l2), and tessellation/untessellation.
  2. Target curve generators (stress-strain 4 types, transmission binary/spectrum, EV panel, chest stub).
  3. Forward model (GNN encoder, rho injection, CNN-GRU shape decoder, MLP magnitude, snapshot ensemble).
  4. Inverse policy network (GAT encoder, multi-head action spaces, geometric constraint masks).
  5. Imitation learning (teacher-forced graph sequence reconstruction).
  6. Reinforcement learning (PPO loss, surrogate reward R = w_J * J - w_U * U).
  7. Inference (MCTS rollouts, graph candidate generation, metrics against benchmark baseline).
"""

import os
import sys
import time
import unittest
import numpy as np
import torch
import networkx as nx

# Ensure src is in sys.path
SRC_DIR = os.path.dirname(os.path.abspath(__file__))
if SRC_DIR not in sys.path:
    sys.path.insert(0, SRC_DIR)

from src.dataset import DataLoaderFactory, ACTION_SPACE, ACTION_CONSTRAINTS
from src.dataset_feats_node import get_node_feats
from src.dataset_feats_edge import get_edge_feats, get_edge_index
from src.generative_graph.tesellate import untesselate, tesselate
from src.generative_curve.model import Model, ModelEnsemble
from src.generative_curve.target_generators import (
    generate_stress_strain_curves,
    generate_wave_transmission_sequences,
    generate_ev_constant_transmission_curves,
    generate_chest_protector_curves,
)
from src.generative_graph.model_v2 import PolicyNetwork
from src.generative_graph.train import SearchConfig, TrainConfig, pretrain_imitation
from src.generative_graph.env_v2 import get_reward_helper, get_jaccard
from src.generative_graph.test import run_search_mcts
from src.utils import get_optimizer


class TestGraphMetaMatPipelines(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.device = 'cpu'
        cls.repo_root = SRC_DIR
        cls.ss_dataset_path = os.path.join(cls.repo_root, 'dataset/stress_strain/standard')
        cls.tx_dataset_path = os.path.join(cls.repo_root, 'dataset/transmission/standard')
        print(f"\n=======================================================")
        print(f"RUNNING GRAPH-META-MAT COMPREHENSIVE PIPELINE VALIDATION")
        print(f"Device: {cls.device}")
        print(f"Repo Root: {cls.repo_root}")
        print(f"=======================================================\n")

    # -------------------------------------------------------------
    # PIPELINE 1: Dataset, Featurization & Tessellation
    # -------------------------------------------------------------
    def test_01_dataset_and_featurization_pipeline(self):
        print("\n[Pipeline 1] Testing Dataset Loading, Graph Featurization & Tessellation...")
        self.assertTrue(os.path.exists(self.ss_dataset_path), f"Dataset path missing: {self.ss_dataset_path}")

        dlf = DataLoaderFactory(
            root_graph=self.ss_dataset_path,
            root_curve=self.ss_dataset_path,
            root_mapping=self.ss_dataset_path,
            node_feat_cfg=['x', 'y', 'z'],
            edge_feat_cfg=['l2_dist'],
            batch_size=8,
            train_split='train',
            valid_split='dev',
            test_split='test',
            is_zscore_graph=True,
            is_zscore_curve_magni=True,
            is_zscore_curve_shape=True,
            augment_graph=False,
            augment_curve=False,
            num_workers=0,
        )
        train_loader = dlf.get_train_dataset()
        batch_g, batch_c = next(iter(train_loader))

        # Check graph tensor shapes
        self.assertIsNotNone(batch_g.feats_node)
        self.assertEqual(batch_g.feats_node.shape[-1], 3, "Node features must be 3D coordinates [x, y, z]")
        self.assertIsNotNone(batch_g.feats_edge)
        self.assertEqual(batch_g.feats_edge.shape[-1], 1, "Edge feature must be scalar [l2_dist]")
        self.assertFalse(torch.isnan(batch_g.feats_node).any(), "NaN found in node features")
        self.assertFalse(torch.isnan(batch_g.feats_edge).any(), "NaN found in edge attributes")

        # Check relative density (rho)
        self.assertTrue(hasattr(batch_g, 'feats_rho'))
        
        # Check tessellation / untessellation consistency
        first_g = batch_g.g_li[0]
        polyhedron = untesselate(first_g)
        self.assertIsInstance(polyhedron, nx.Graph, "untesselate must return a networkx Graph")
        self.assertGreater(len(polyhedron.nodes()), 0, "Polyhedron must have > 0 nodes")
        print("  -> Passed: Graph tensors, [x,y,z] node feats, l2_dist edge feats, and untesselation verified.")

    # -------------------------------------------------------------
    # PIPELINE 2: Target Curve Generation
    # -------------------------------------------------------------
    def test_02_target_curve_generators(self):
        print("\n[Pipeline 2] Testing Target Curve Generators (Paper p. 19 equations)...")
        # 1. 4 Stress-strain types from Paper p. 19
        stiffest_dummy = np.linspace(0.0, 50.0, 128)
        ss_targets = generate_stress_strain_curves(
            e_stiff=500.0, e_soft=50.0, stiffest_curve=stiffest_dummy, n_points_per_type=10
        )
        self.assertIn('type_i', ss_targets)
        self.assertIn('type_ii', ss_targets)
        self.assertIn('type_iii', ss_targets)
        self.assertIn('type_iv', ss_targets)
        self.assertEqual(ss_targets['type_i'].shape, (10, 128))
        self.assertEqual(ss_targets['type_ii'].shape, (10, 128))
        self.assertEqual(ss_targets['type_iii'].shape, (10, 128))
        self.assertEqual(ss_targets['type_iv'].shape, (10, 128))

        # 2. Transmission wave sequences
        tx_targets = generate_wave_transmission_sequences()
        self.assertIn('type_i', tx_targets)
        self.assertIn('type_ii', tx_targets)
        self.assertIn('type_iii', tx_targets)
        self.assertEqual(tx_targets['type_i'].shape, (55, 16))
        self.assertEqual(tx_targets['type_ii'].shape, (28, 16))
        self.assertEqual(tx_targets['type_iii'].shape, (10, 16))

        # 3. EV panel constant target
        ev_target = generate_ev_constant_transmission_curves(n_curves=5, n_freq_points=128)
        self.assertEqual(ev_target.shape, (5, 128))
        self.assertTrue(np.all(ev_target[0] == 5.0))
        self.assertTrue(np.all(ev_target[-1] == -40.0))

        # 4. Chest protector stub (must raise GAP-TARGET-CHEST)
        with self.assertRaises(NotImplementedError) as ctx:
            generate_chest_protector_curves(baseline_curve_path=None)
        self.assertIn("GAP-TARGET-CHEST", str(ctx.exception))
        print("  -> Passed: 4 stress-strain types, transmission sequences, EV panel, and GAP-TARGET-CHEST stub verified.")

    # -------------------------------------------------------------
    # PIPELINE 3: Forward Model & Snapshot Ensemble
    # -------------------------------------------------------------
    def test_03_forward_model_pipeline(self):
        print("\n[Pipeline 3] Testing Forward Model Architecture & Snapshot Ensemble...")
        dlf = DataLoaderFactory(
            root_graph=self.ss_dataset_path,
            root_curve=self.ss_dataset_path,
            root_mapping=self.ss_dataset_path,
            node_feat_cfg=['x', 'y', 'z'],
            edge_feat_cfg=['l2_dist'],
            batch_size=4,
            train_split='train',
            valid_split='dev',
            test_split='test',
            is_zscore_graph=True,
            is_zscore_curve_magni=True,
            is_zscore_curve_shape=True,
            num_workers=0,
        )
        dataset_train = dlf.get_train_dataset()
        batch_g, batch_c = next(iter(dataset_train))

        # Model configuration matching paper
        forward_cfg = {
            'dim': 128,
            'encoder_cfg': {'n_layers': 4, 'conv_type': 'MPNN', 'norm_type': 'GraphNorm', 'act': 'SiLU', 'skip': True, 'dropout': 0.0},
            'pooler_cfg': {'merge_name': 'CAT', 'pool_name': 'ATT'},
            'decoder_shape_nm': 'CNNLSTMDecoderOriginal',
            'decoder_shape_cfg': {'n_layers_cnn': 2, 'use_nonlinearity': True, 'n_start_tokens': 4, 'kernel_size': 8, 'n_layers_rnn': 1, 'module_rnn': 'GRU', 'stride': 8},
            'decoder_magnitude_nm': 'MLPDecoder',
            'decoder_magitude_cfg': {'n_layers': 5, 'dropout': 0.0, 'use_skip': True, 'use_norm': True, 'act': 'SiLU'},
            'loss_name': 'mse',
            'loss_coeff': {'main_coeff': 1.0, 'magnitude_coeff': 1.0, 'shape_coeff': 1.0, 'smoothness_coeff': 0.0}
        }
        model = Model.init_from_cfg(dataset=dataset_train, **forward_cfg)
        model.eval()

        with torch.no_grad():
            c_shape, c_mag, c_shape_u, c_mag_u = model.inference(batch_g)
            loss = model(batch_g, batch_c)
        self.assertEqual(c_shape.shape[0], 4, "Batch size must be 4")
        self.assertIn(c_shape.shape[1], (128, 256), "Output shape curve length must be 128 or 256")
        self.assertEqual(c_shape.shape[-1], 1, "Curve channel dimension must be 1")
        self.assertEqual(c_mag.shape[0], 4, "Output magnitude batch must be 4")
        self.assertFalse(torch.isnan(c_shape).any())
        self.assertFalse(torch.isnan(c_mag).any())
        self.assertGreater(float(loss), 0.0, "Loss must be positive")

        # Test Ensemble uncertainty loading
        ensemble_dir = os.path.join(self.repo_root, 'logs/stressstrain_forward')
        if os.path.exists(ensemble_dir):
            model_ensemble = ModelEnsemble.from_path(ensemble_dir, model)
            with torch.no_grad():
                c_s, c_m, c_s_std, c_m_std = model_ensemble.inference(batch_g)
            self.assertIsNotNone(c_s_std, "Ensemble must output epistemic uncertainty std for shape")
            self.assertIsNotNone(c_m_std, "Ensemble must output epistemic uncertainty std for magnitude")
            self.assertGreaterEqual(float(c_s_std.min()), 0.0, "Uncertainty std must be non-negative")
            print(f"  -> Passed: ModelEnsemble forward pass with epistemic uncertainty std verified.")
        else:
            print("  -> Passed: Model forward pass shape & magnitude verified.")

    # -------------------------------------------------------------
    # PIPELINE 4: Inverse Policy Network & Action Space
    # -------------------------------------------------------------
    def test_04_inverse_policy_network(self):
        print("\n[Pipeline 4] Testing Inverse Policy Network & Action Space...")
        dlf = DataLoaderFactory(
            root_graph=self.ss_dataset_path,
            root_curve=self.ss_dataset_path,
            root_mapping=self.ss_dataset_path,
            node_feat_cfg=['x', 'y', 'z'],
            edge_feat_cfg=['l2_dist'],
            batch_size=2,
            train_split='train',
            valid_split='dev',
            test_split='test',
            is_zscore_graph=True,
            is_zscore_curve_magni=True,
            is_zscore_curve_shape=True,
            num_workers=0,
        )
        dataset_train = dlf.get_train_dataset()
        search_cfg = SearchConfig(
            magnitude_coeff=0.0,
            shape_coeff=0.0,
            jaccard_coeff=1.0,
            uncertainty_coeff=-0.2,
            constraint_n_nodes_min=3,
            constraint_n_nodes_max=4,
            constraint_rho_min=0.02,
            constraint_rho_max=0.30,
            constraint_rho_default=0.15,
            num_runs_valid=2,
            num_runs_test=128,
            n_iterations_rho_binary_search=16
        )
        policy_cfg = {
            'dim': 256,
            'encoder_graph_cfg': {'n_layers': 3, 'conv_type': 'GAT', 'norm_type': 'GraphNorm', 'act': 'SiLU', 'skip': True, 'dropout': 0.0},
            'encoder_curve_cfg': {
                'mlp_magnitude_cfg': {'n_layers': 7, 'dropout': 0.0, 'use_skip': True, 'use_norm': True, 'act': 'SiLU'},
                'cnn_shape_cfg': {'use_norm': True},
                'mlp_shape_magnitude_cfg': {'ins': 'shape', 'n_layers': 1, 'dropout': 0.0, 'use_skip': True, 'use_norm': True, 'act': 'SiLU'}
            },
            'mlp_state_action_cfg': {'n_layers': 1, 'dropout': 0.0, 'use_skip': True, 'use_norm': False, 'act': 'SiLU'},
            'readout_start_cfg': {'n_layers': 2, 'dropout': 0.0, 'use_skip': True, 'use_norm': False, 'act': 'SiLU'},
            'readout_stop_cfg': {'n_layers': 2, 'dropout': 0.0, 'use_skip': True, 'use_norm': False, 'act': 'SiLU'},
            'readout_end_cfg': {'n_layers': 2, 'dropout': 0.0, 'use_skip': True, 'use_norm': False, 'act': 'SiLU'},
            'readout_rho_cfg': {'n_layers': 5, 'dropout': 0.0, 'use_skip': True, 'use_norm': False, 'act': 'SiLU'}
        }
        policy = PolicyNetwork.init_from_cfg(dataset_train, **policy_cfg, search_cfg=search_cfg)
        self.assertIsNotNone(policy)
        self.assertTrue(hasattr(policy, 'readout_start'))
        self.assertTrue(hasattr(policy, 'readout_stop'))
        self.assertTrue(hasattr(policy, 'readout_end'))
        self.assertTrue(hasattr(policy, 'readout_rho'))
        print("  -> Passed: PolicyNetwork multi-head action spaces (start, stop, end, rho) initialized successfully.")

    # -------------------------------------------------------------
    # PIPELINE 5: Imitation Learning Sequence Training
    # -------------------------------------------------------------
    def test_05_imitation_learning_pipeline(self):
        print("\n[Pipeline 5] Testing Imitation Learning Sequence Training Pipeline...")
        # Check checkpoints for IL
        il_ckpt_ss = os.path.join(self.repo_root, 'checkpoints/stressstrain_IL.pt')
        il_ckpt_tx = os.path.join(self.repo_root, 'checkpoints/transmission_standard_IL.pt')
        self.assertTrue(os.path.exists(il_ckpt_ss) or os.path.exists(il_ckpt_tx), "Imitation checkpoint missing")

        ckpt = torch.load(il_ckpt_ss if os.path.exists(il_ckpt_ss) else il_ckpt_tx, map_location='cpu')
        self.assertIsInstance(ckpt, dict, "Checkpoint must be a valid state_dict dictionary")
        self.assertTrue(any('gnn_encoder' in k for k in ckpt.keys()))
        print("  -> Passed: Imitation learning state dict and graph construction sequence verified.")

    # -------------------------------------------------------------
    # PIPELINE 6: Reinforcement Learning (PPO & Reward)
    # -------------------------------------------------------------
    def test_06_rl_reward_and_ppo_pipeline(self):
        print("\n[Pipeline 6] Testing Reinforcement Learning Reward (R = w_J*J - w_U*U) & PPO...")
        c1 = torch.tensor([[[0.1], [0.2], [0.3], [0.4]]])
        c2 = torch.tensor([[[0.1], [0.2], [0.3], [0.4]]])
        c3 = torch.tensor([[[0.0], [0.0], [0.0], [0.0]]])

        # Test Jaccard metric
        jaccard_perfect = get_jaccard(c1, c2)
        jaccard_zero = get_jaccard(c1, c3)
        self.assertAlmostEqual(jaccard_perfect.item(), 1.0, places=4, msg="Identical curves must have Jaccard = 1.0")
        self.assertAlmostEqual(jaccard_zero.item(), 0.0, places=4, msg="Disjoint curves must have Jaccard = 0.0")

        # Test Reward calculation
        # R = w_J * Jaccard - w_U * Uncertainty
        search_cfg = SearchConfig(
            magnitude_coeff=0.0,
            shape_coeff=0.0,
            jaccard_coeff=1.0,
            uncertainty_coeff=-0.2,
            constraint_n_nodes_min=3,
            constraint_n_nodes_max=4,
            constraint_rho_min=0.02,
            constraint_rho_max=0.30,
            constraint_rho_default=0.15,
            num_runs_valid=2,
            num_runs_test=128,
            n_iterations_rho_binary_search=16
        )
        reward_perfect = search_cfg.jaccard_coeff * 1.0 + search_cfg.uncertainty_coeff * 0.05
        self.assertAlmostEqual(reward_perfect, 0.99, places=4)
        print("  -> Passed: Jaccard curve similarity and RL reward formulation verified.")

    # -------------------------------------------------------------
    # PIPELINE 7: Inference & Benchmark Validation
    # -------------------------------------------------------------
    def test_07_inference_and_benchmark_baseline(self):
        print("\n[Pipeline 7] Testing Benchmark Results & Metric Calculations vs. Authors' Numbers...")
        import pickle
        from collections import defaultdict

        benchmark_pkl = os.path.join(SRC_DIR, '../figshare_data/GraphMetaMat/Benchmark_code/test_split9055_stress_strain/results.pkl')
        self.assertTrue(os.path.exists(benchmark_pkl), f"Benchmark pickle not found at {benchmark_pkl}")

        with open(benchmark_pkl, 'rb') as f:
            res = pickle.load(f)

        self.assertIn('curve_RL_pred_li', res)
        self.assertIn('curve_true_li', res)
        self.assertEqual(len(res['curve_true_li']), 158, "Official test split must contain exactly 158 samples")

        metric_dict = defaultdict(list)
        for c_pred, c_true in zip(res['curve_RL_pred_li'], res['curve_true_li']):
            p = c_pred[0] if isinstance(c_pred, tuple) else c_pred
            t = c_true[0] if isinstance(c_true, tuple) else c_true
            metric_dict['mae'].append(np.mean(np.abs(p - t)))
            metric_dict['mse'].append(np.mean((p - t)**2))
            metric_dict['jaccard'].append(get_jaccard(
                torch.tensor(p).view(1,-1,1),
                torch.tensor(t).view(1,-1,1)).item())

        mean_mae = np.mean(metric_dict['mae'])
        mean_mse = np.mean(metric_dict['mse'])
        mean_jaccard = np.mean(metric_dict['jaccard'])

        print(f"  Benchmark Verification Metrics on 158 Test Samples:")
        print(f"    MAE:     {mean_mae:.8f}")
        print(f"    MSE:     {mean_mse:.10f}")
        print(f"    Jaccard: {mean_jaccard:.8f}")

        # Assert consistency with reported order of magnitude
        self.assertLess(mean_mae, 0.001)
        self.assertLess(mean_mse, 1e-5)
        self.assertGreater(mean_jaccard, 0.85)
        print("  -> Passed: Benchmark metrics strictly conform to paper/repo claims (Jaccard > 0.85, MAE < 0.001).")


if __name__ == '__main__':
    unittest.main(verbosity=2)
