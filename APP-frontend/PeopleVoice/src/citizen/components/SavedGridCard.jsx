import { Heart, MessageCircle } from "lucide-react";

const SavedGridCard = ({ post, viewMode, onClick, isDark }) => {
  if (!post) return null;

  const image = post.images_data?.[0];
  const likeCount = post.likes?.length || 0;
  const commentCount = post.comments?.length || 0;

  return (
    <div
      onClick={onClick}
      className={`relative aspect-square cursor-pointer group overflow-hidden bg-gray-100 dark:bg-gray-800 rounded-lg shadow-md transition-all duration-300 ${
        viewMode === "list" ? "rounded-xl" : ""
      }`}
    >
      {image ? (
        <img
          src={image}
          alt="saved"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
          No Image
        </div>
      )}

      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-6 text-white transition-opacity duration-200">
        <div className="flex items-center gap-1 font-semibold text-sm">
          <Heart className="fill-white" size={16} />
          {likeCount}
        </div>
        <div className="flex items-center gap-1 font-semibold text-sm">
          <MessageCircle size={16} />
          {commentCount}
        </div>
      </div>
    </div>
  );
};

export default SavedGridCard;