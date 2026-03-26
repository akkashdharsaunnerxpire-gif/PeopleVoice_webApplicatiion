import { Heart, MessageCircle } from "lucide-react";

const SavedGridCard = ({ post, onClick }) => {
  if (!post) return null;

  const image = post.images_data?.[0];
  const likeCount = post.likes?.length || 0;
  const commentCount = post.comments?.length || 0;

  return (
    <div
      onClick={onClick}
      className="relative aspect-square cursor-pointer group overflow-hidden bg-gray-100"
    >
      {image ? (
        <img src={image} alt="saved" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
          No Image
        </div>
      )}

      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-6 text-white transition">
        <div className="flex items-center gap-1 font-semibold">
          <Heart className="fill-white" size={18} />
          {likeCount}
        </div>
        <div className="flex items-center gap-1 font-semibold">
          <MessageCircle size={18} />
          {commentCount}
        </div>
      </div>
    </div>
  );
};

export default SavedGridCard;