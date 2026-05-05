// src/components/SavedGridCard.jsx

import { Heart, MessageCircle } from "lucide-react";

const SavedGridCard = ({ post, onClick, isDark }) => {
  if (!post) return null;

  const image = post.images?.[0]?.url;
  const likeCount = post.likes?.length || 0;
  const commentCount = post.comments?.length || 0;

  return (
    <div
      onClick={onClick}
      className={`relative aspect-square cursor-pointer group overflow-hidden 
  bg-black rounded-lg 
  transition-all duration-300`}
    >
      {image ? (
        <img
          src={image}
          alt="saved issue"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-gray-400 text-sm">
          No Image
        </div>
      )}

      {/* Overlay with stats */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent 
                      opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 
                      flex items-end justify-between p-4"
      >
        <div className="flex items-center gap-5 text-white">
          <div className="flex items-center gap-1.5">
            <Heart className="w-4 h-4 fill-white" />
            <span className="text-sm font-medium">{likeCount}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm font-medium">{commentCount}</span>
          </div>
        </div>
      </div>

      {/* Department badge at top */}
      {post.department && (
        <div className="absolute top-3 left-3 bg-black/60 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">
          {post.department}
        </div>
      )}
    </div>
  );
};

export default SavedGridCard;
