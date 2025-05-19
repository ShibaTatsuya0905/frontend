import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } 
    from 'react-router-dom';
import { getPostById, getSuggestedPosts } from '../services/api'; 
import './PostDetailPage.css';
function SuggestedPosts({ posts }) { 
    const navigate = useNavigate();

    if (!posts || posts.length === 0) {
        return null;
    }

    const handleSuggestionClick = (slugOrId) => {
        navigate(`/posts/${slugOrId}`);
    };


    return (
        <div className="suggested-posts-section">
            <h3 className="suggested-posts-title">Bài viết có thể bạn quan tâm</h3>
            <div className="suggested-posts-grid">
                {posts.map(post => (
                    <article key={post.id} className="suggested-post-card" onClick={() => handleSuggestionClick(post.slug || post.id)}>
                        {post.cover_image_url && (
                            <div className="suggested-post-image-link">
                                <img src={post.cover_image_url} alt={post.title} className="suggested-post-cover-image"/>
                            </div>
                        )}
                        <div className="suggested-post-content">
                            <h4 className="suggested-post-title">
                                {/* Use a span or div instead of Link if onClick handles navigation */}
                                <span>{post.title}</span>
                            </h4>
                            {post.categoryDetails && (
                                <span className="suggested-post-category">
                                    {post.categoryDetails.name}
                                </span>
                            )}
                             <p className="suggested-post-excerpt">
                                {post.excerpt || post.title} {/* Fallback to title if no excerpt */}
                            </p>
                        </div>
                    </article>
                ))}
            </div>
        </div>
    );
}


function PostDetailPage() {
    const { slugOrId } = useParams();
    const [post, setPost] = useState(null);
    const [suggestedPosts, setSuggestedPosts] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate(); 


    useEffect(() => {
        const fetchPostData = async () => {
            console.log("[PostDetailPage] Received slugOrId from URL params:", slugOrId);

            if (!slugOrId || slugOrId === "undefined" || slugOrId === "null" || slugOrId.trim() === "") {
                setError('Không thể tải bài viết. ID hoặc Slug của bài viết là bắt buộc và không hợp lệ.');
                setLoading(false);
                setPost(null);
                setSuggestedPosts([]);
                return;
            }

            setLoading(true);
            setError('');
            setPost(null); 
            setSuggestedPosts([]);

            try {
                const mainPostData = await getPostById(slugOrId);
                console.log("[PostDetailPage] Main post data received:", mainPostData);
                setPost(mainPostData);

                if (mainPostData && mainPostData.id) {
                    const suggestions = await getSuggestedPosts(
                        mainPostData.id,
                        mainPostData.category_id, 
                        3 
                    );
                    console.log("[PostDetailPage] Suggested posts received:", suggestions);
                    setSuggestedPosts(suggestions || []);
                }

            } catch (err) {
                console.error("[PostDetailPage] Error fetching post data:", err.response || err);
                setError('Không thể tải bài viết. ' + (err.response?.data?.message || err.message));
                setPost(null);
                setSuggestedPosts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchPostData();
        window.scrollTo(0, 0); 
    }, [slugOrId]);

    if (loading && !post) return <p className="loading-message message">Đang tải bài viết...</p>; // Show loading only if no post is displayed yet
    if (error) return <p className="error-message message">{error}</p>;
    if (!post) return <p className="info-message message">Không tìm thấy bài viết, hoặc đang có lỗi tải dữ liệu.</p>;

    return (
        <>
            <article className="post-detail">
                <button onClick={() => navigate(-1)} className="back-link" style={{marginBottom: '1rem', display: 'inline-block'}}>
                    « Quay lại
                </button>
                <header className="post-detail-header">
                    <h1>{post.title}</h1>
                    <div className="post-meta">
                        <span>Tác giả: {post.authorDetails?.username || 'N/A'}</span>
                        <span>Ngày đăng: {new Date(post.published_at || post.created_at).toLocaleDateString()}</span>
                        {post.categoryDetails && (
                            <span>Danh mục: <Link to={`/?categoryId=${post.categoryDetails.id}`}>{post.categoryDetails.name}</Link></span>
                        )}
                        <span>Lượt xem: {post.views}</span>
                    </div>
                </header>

                {post.cover_image_url && (
                    <div className="post-cover-image-container">
                        <img src={post.cover_image_url} alt={post.title} className="post-cover-image" />
                    </div>
                )}

                {post.excerpt && <p className="post-excerpt"><em>{post.excerpt}</em></p>}

                <div className="post-content" dangerouslySetInnerHTML={{ __html: post.content }} />

                {post.tags && post.tags.length > 0 && (
                    <div className="post-tags-container">
                        <strong>Thẻ: </strong>
                        {post.tags.map((tag) => (
                            <Link key={tag.id} to={`/?tagId=${tag.id}`} className="post-tag">
                                #{tag.name}
                            </Link>
                        ))}
                    </div>
                )}
            </article>

            {/* Suggested Posts Section */}
            {loading && suggestedPosts.length === 0 && <p className="loading-message message">Đang tải đề xuất...</p>}
            {!loading && <SuggestedPosts posts={suggestedPosts} />}
        </>
    );
}

export default PostDetailPage;