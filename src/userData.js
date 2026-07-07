import { getPostsByUser, getCommentsByPost } from "./api.js";
import { state } from "./state.js";

export async function fetchUserData(userId) {
  let posts;

  if (state.cache.postsByUser[userId]) {
    posts = state.cache.postsByUser[userId];
  } else {
    posts = await getPostsByUser(userId);
    state.cache.postsByUser[userId] = posts;
  }

  const commentsPromises = posts.map((post) => getCommentsByPost(post.id));
  const commentsResults = await Promise.all(commentsPromises);

  const commentsByPostId = {};
  posts.forEach((post, index) => {
    commentsByPostId[post.id] = commentsResults[index];
  });

  return { posts, commentsByPostId };
}
