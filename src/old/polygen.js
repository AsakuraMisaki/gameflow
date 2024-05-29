function extractVertices(imageData) {
  const { width, height, data } = imageData;
  const grid = [];
  for (let y = 0; y < height; y++) {
      const row = [];
      for (let x = 0; x < width; x++) {
          const alpha = data[(y * width + x) * 4 + 3];
          row.push(alpha > 128 ? 1 : 0);
      }
      grid.push(row);
  }

  const vertices = marchingSquares(grid);
  console.log(grid);
  return vertices;
}

function marchingSquares(grid) {
  const vertices = [];
  const height = grid.length;
  const width = grid[0].length;

  const getVertex = (x, y) => ({ x, y });

  const edgeTable = [
      [],
      [[0, 1], [1, 0]],
      [[1, 0], [1, 1]],
      [[0, 1], [1, 1]],
      [[1, 1], [0, 1]],
      [[1, 0], [0, 1], [0, 0], [1, 1]],
      [[1, 1], [1, 0]],
      [[0, 1], [1, 0]],
      [[0, 1], [0, 0]],
      [[1, 0], [0, 1]],
      [[1, 0], [0, 0]],
      [[0, 1], [1, 1]],
      [[1, 0], [1, 1]],
      [[1, 0], [1, 1]],
      [[1, 1], [0, 1]],
  ];

  for (let y = 0; y < height - 1; y++) {
      for (let x = 0; x < width - 1; x++) {
          const caseIndex =
              (grid[y][x] << 3) |
              (grid[y][x + 1] << 2) |
              (grid[y + 1][x + 1] << 1) |
              grid[y + 1][x];
          const edges = edgeTable[caseIndex];
          if (edges && edges.length) {
              console.log(edges);
              // let v1 = a[0];
              // let v2 = a[1];
              // const vertex1 = getVertex(x + v1[0], y + v1[1]);
              // const vertex2 = getVertex(x + v2[0], y + v2[1]);
              // vertices.push(vertex1, vertex2);
              let v1 = edges[0];
              let v2 = edges[1];
              const vertex1 = getVertex(x + v1[0], y + v1[1]);
              const vertex2 = getVertex(x + v2[0], y + v2[1]);
              vertices.push(vertex1, vertex2);
              // edges.forEach((a) => {
              //     let v1 = a[0];
              //     let v2 = a[1];
              //     const vertex1 = getVertex(x + v1[0], y + v1[1]);
              //     const vertex2 = getVertex(x + v2[0], y + v2[1]);
              //     vertices.push(vertex1, vertex2);
              // });
          }
      }
  }

  return vertices;
}

export { extractVertices, marchingSquares }