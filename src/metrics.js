export function calculatePostCount(posts) {
  return posts.length;
}

export function calculateAverageChars(posts) {
  if (posts.length === 0) return 0;
  const totalChars = posts.reduce((sum, post) => sum + post.body.length, 0);
  return totalChars / posts.length;
}

export function calculateAverageComments(posts, commentsByPostId) {
  if (posts.length === 0) return 0;
  const totalComments = posts.reduce((sum, post) => {
    const comments = commentsByPostId[post.id] || [];
    return sum + comments.length;
  }, 0);
  return totalComments / posts.length;
}

export function calculateMetrics(posts, commentsByPostId) {
  return {
    postCount: calculatePostCount(posts),
    avgChars: calculateAverageChars(posts),
    avgComments: calculateAverageComments(posts, commentsByPostId),
  };
}
export function filterPostsByMinChars(posts, minChars) {
  if (!minChars || minChars <= 0) return posts;
  return posts.filter((post) => post.body.length >= minChars);
}

export function getUserStatus(postCount, minPosts) {
  if (!minPosts || minPosts <= 0) return "Ativo"; // sem filtro, considera ativo por padrão
  return postCount >= minPosts ? "Ativo" : "Inativo";
}
