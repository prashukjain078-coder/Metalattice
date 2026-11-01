/**
 * Generates an in-memory sample 3D CAD model (.stl) representing a structural bracket.
 * Enables instant one-click preview and testing of the 3D viewer without requiring external file downloads.
 */
export function createSampleBracketFile(): File {
  // ASCII STL for a chamfered structural test bracket
  const stlContent = `solid sample_bracket
  facet normal 0.0 0.0 -1.0
    outer loop
      vertex -10.0 -10.0 -5.0
      vertex 10.0 -10.0 -5.0
      vertex 10.0 10.0 -5.0
    endloop
  endfacet
  facet normal 0.0 0.0 -1.0
    outer loop
      vertex -10.0 -10.0 -5.0
      vertex 10.0 10.0 -5.0
      vertex -10.0 10.0 -5.0
    endloop
  endfacet
  facet normal 0.0 0.0 1.0
    outer loop
      vertex -8.0 -8.0 5.0
      vertex 8.0 8.0 5.0
      vertex 8.0 -8.0 5.0
    endloop
  endfacet
  facet normal 0.0 0.0 1.0
    outer loop
      vertex -8.0 -8.0 5.0
      vertex -8.0 8.0 5.0
      vertex 8.0 8.0 5.0
    endloop
  endfacet
  facet normal 0.0 -1.0 0.0
    outer loop
      vertex -10.0 -10.0 -5.0
      vertex 8.0 -8.0 5.0
      vertex 10.0 -10.0 -5.0
    endloop
  endfacet
  facet normal 0.0 -1.0 0.0
    outer loop
      vertex -10.0 -10.0 -5.0
      vertex -8.0 -8.0 5.0
      vertex 8.0 -8.0 5.0
    endloop
  endfacet
  facet normal 1.0 0.0 0.0
    outer loop
      vertex 10.0 -10.0 -5.0
      vertex 8.0 8.0 5.0
      vertex 10.0 10.0 -5.0
    endloop
  endfacet
  facet normal 1.0 0.0 0.0
    outer loop
      vertex 10.0 -10.0 -5.0
      vertex 8.0 -8.0 5.0
      vertex 8.0 8.0 5.0
    endloop
  endfacet
  facet normal 0.0 1.0 0.0
    outer loop
      vertex 10.0 10.0 -5.0
      vertex -8.0 8.0 5.0
      vertex -10.0 10.0 -5.0
    endloop
  endfacet
  facet normal 0.0 1.0 0.0
    outer loop
      vertex 10.0 10.0 -5.0
      vertex 8.0 8.0 5.0
      vertex -8.0 8.0 5.0
    endloop
  endfacet
  facet normal -1.0 0.0 0.0
    outer loop
      vertex -10.0 10.0 -5.0
      vertex -8.0 -8.0 5.0
      vertex -10.0 -10.0 -5.0
    endloop
  endfacet
  facet normal -1.0 0.0 0.0
    outer loop
      vertex -10.0 10.0 -5.0
      vertex -8.0 8.0 5.0
      vertex -8.0 -8.0 5.0
    endloop
  endfacet
endsolid sample_bracket`

  const blob = new Blob([stlContent], { type: 'model/stl' })
  return new File([blob], 'bracket_chassis_sample.stl', { type: 'model/stl' })
}

