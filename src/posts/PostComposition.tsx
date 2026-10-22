import React from "react";
import { useCurrentFrame } from "remotion";
import { loadFonts } from "../fonts";
import type { Post } from "./post";
import { Slide } from "./Slides";

loadFonts();

export type PostProps = { post: Post };

/** Each frame of this composition is one slide of the post. */
export const PostComposition: React.FC<PostProps> = ({ post }) => {
  const frame = useCurrentFrame();
  return <Slide content={post.content} index={frame} />;
};
