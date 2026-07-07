import test from "node:test";
import assert from "node:assert/strict";
import { fetchUserData } from "./userData.js";
import { state } from "./state.js";

function resetStateCache() {
  state.cache.postsByUser = {};
  state.cache.commentsByPost = {};
}

test("fetchUserData: busca posts e comentarios do usuario", async () => {
  resetStateCache();

  const api = {
    getPostsByUser: async () => [
      { id: 1, userId: 10, body: "post 1" },
      { id: 2, userId: 10, body: "post 2" },
    ],
    getCommentsByPost: async (postId) => [{ id: postId * 100, postId }],
  };

  const result = await fetchUserData(10, api);

  assert.equal(result.posts.length, 2);
  assert.deepEqual(result.commentsByPostId, {
    1: [{ id: 100, postId: 1 }],
    2: [{ id: 200, postId: 2 }],
  });
});

test("fetchUserData: reaproveita posts e comentarios em cache", async () => {
  resetStateCache();

  let postsCalls = 0;
  let commentsCalls = 0;
  const api = {
    getPostsByUser: async () => {
      postsCalls += 1;
      return [{ id: 1, userId: 10, body: "post 1" }];
    },
    getCommentsByPost: async (postId) => {
      commentsCalls += 1;
      return [{ id: postId * 100, postId }];
    },
  };

  await fetchUserData(10, api);
  await fetchUserData(10, api);

  assert.equal(postsCalls, 1);
  assert.equal(commentsCalls, 1);
});

test("fetchUserData: busca apenas comentarios ainda ausentes no cache", async () => {
  resetStateCache();
  state.cache.commentsByPost[1] = [{ id: 100, postId: 1 }];

  const fetchedCommentPostIds = [];
  const api = {
    getPostsByUser: async () => [
      { id: 1, userId: 10, body: "post 1" },
      { id: 2, userId: 10, body: "post 2" },
    ],
    getCommentsByPost: async (postId) => {
      fetchedCommentPostIds.push(postId);
      return [{ id: postId * 100, postId }];
    },
  };

  const result = await fetchUserData(10, api);

  assert.deepEqual(fetchedCommentPostIds, [2]);
  assert.deepEqual(result.commentsByPostId[1], [{ id: 100, postId: 1 }]);
  assert.deepEqual(result.commentsByPostId[2], [{ id: 200, postId: 2 }]);
});
