import { getPostsByUser, getCommentsByPost } from "./api.js";
import { state } from "./state.js";

export async function fetchUserData(
  userId,
  api = { getPostsByUser, getCommentsByPost },
) {
  let posts;

  if (state.cache.postsByUser[userId]) {
    posts = state.cache.postsByUser[userId];
  } else {
    posts = await api.getPostsByUser(userId);
    state.cache.postsByUser[userId] = posts;
  }

  const commentsPromises = posts.map(async (post) => {
    if (state.cache.commentsByPost[post.id]) {
      return state.cache.commentsByPost[post.id];
    }

    const comments = await api.getCommentsByPost(post.id);
    state.cache.commentsByPost[post.id] = comments;
    return comments;
  });

  const commentsResults = await Promise.all(commentsPromises);
  const commentsByPostId = {};

  posts.forEach((post, index) => {
    commentsByPostId[post.id] = commentsResults[index];
  });

  return { posts, commentsByPostId };
}
