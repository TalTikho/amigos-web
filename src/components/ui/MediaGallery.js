import React, { useState } from 'react';
import '../../style/MediaGallery.css';
import { useUser } from '../../services/UserContext';

/**
 * MediaGallery - Component to display chat media
 * Shows photos, videos, and documents from the chat
 * Similar to WhatsApp's media gallery with:
 * - Grid layout for photos and videos
 * - List layout for documents
 * - Full-screen media viewer
 * - Download functionality
 */
const MediaGallery = ({ media = [], loading = false }) => {
    const [selectedMedia, setSelectedMedia] = useState(null);
    const [mediaFilter, setMediaFilter] = useState('all'); // 'all', 'photos', 'videos', 'documents'
    const { user } = useUser();

    // Ensure media is always an array
    const mediaArray = Array.isArray(media) ? media : [];

    // Filter media based on type
    const getFilteredMedia = () => {
        if (mediaFilter === 'all') return mediaArray;
        if (mediaFilter === 'photos') return mediaArray.filter(m => m.type === 'image');
        if (mediaFilter === 'videos') return mediaArray.filter(m => m.type === 'video');
        if (mediaFilter === 'documents') return mediaArray.filter(m => m.type === 'document');
        return mediaArray;
    };

    // Get media type icon
    const getMediaIcon = (type, mimeType) => {
        if (type === 'image') return '🖼️';
        if (type === 'video') return '🎥';
        if (type === 'document') {
            if (mimeType?.includes('pdf')) return '📄';
            if (mimeType?.includes('word')) return '📝';
            if (mimeType?.includes('excel') || mimeType?.includes('sheet')) return '📊';
            if (mimeType?.includes('powerpoint') || mimeType?.includes('presentation')) return '📈';
            return '📎';
        }
        return '📎';
    };

    // Format file size
    const formatFileSize = (bytes) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    // Handle media click
    const handleMediaClick = (mediaItem) => {
        setSelectedMedia(mediaItem);
    };

    // Handle download
    const handleDownload = async (mediaItem) => {
        if (mediaItem._id && user?._id && user?.token) {
            try {
                // Use your existing download route: GET /media/:userId/download/:mediaId
                const downloadUrl = `/media/${user._id}/download/${mediaItem._id}`;
                
                // Create a temporary link to trigger download
                const link = document.createElement('a');
                link.href = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${downloadUrl}`;
                link.download = mediaItem.filename || mediaItem.originalName || 'download';
                
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } catch (error) {
                console.error('Download failed:', error);
            }
        }
    };

    const getMediaUrl = (mediaItem) => {
        // If you have direct URLs in your media model, use them
        if (mediaItem.url) return mediaItem.url;
        
        // Otherwise, construct streaming URL using your route: GET /media/:userId/stream/:filename
        if (mediaItem.filename && user?._id) {
            return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/media/${user._id}/stream/${mediaItem.filename}`;
        }
        
        return null;
    };

    const filteredMedia = getFilteredMedia();
    const photos = mediaArray.filter(m => m.type === 'image');
    const videos = mediaArray.filter(m => m.type === 'video');
    const documents = mediaArray.filter(m => m.type === 'document');

    // Show loading state
    if (loading) {
        return (
            <div className="media-gallery">
                <div className="media-loading">
                    <div className="loading-spinner" />
                    <p>Loading media...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="media-gallery">
            {/* Media Filter Tabs */}
            <div className="media-filter-tabs">
                <button
                    className={`filter-tab ${mediaFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setMediaFilter('all')}
                >
                    All ({mediaArray.length})
                </button>
                <button
                    className={`filter-tab ${mediaFilter === 'photos' ? 'active' : ''}`}
                    onClick={() => setMediaFilter('photos')}
                >
                    Photos ({photos.length})
                </button>
                <button
                    className={`filter-tab ${mediaFilter === 'videos' ? 'active' : ''}`}
                    onClick={() => setMediaFilter('videos')}
                >
                    Videos ({videos.length})
                </button>
                <button
                    className={`filter-tab ${mediaFilter === 'documents' ? 'active' : ''}`}
                    onClick={() => setMediaFilter('documents')}
                >
                    Documents ({documents.length})
                </button>
            </div>

            {/* Media Content */}
            <div className="media-content">
                {filteredMedia.length === 0 ? (
                    <div className="no-media">
                        <div className="no-media-icon">
                            {mediaFilter === 'photos' && '📷'}
                            {mediaFilter === 'videos' && '🎬'}
                            {mediaFilter === 'documents' && '📁'}
                            {mediaFilter === 'all' && '📂'}
                        </div>
                        <p>No {mediaFilter === 'all' ? 'media' : mediaFilter} found</p>
                    </div>
                ) : (
                    <>
                        {/* Grid Layout for Photos and Videos */}
                        {(mediaFilter === 'all' || mediaFilter === 'photos' || mediaFilter === 'videos') && (
                            <div className="media-grid">
                                {filteredMedia
                                    .filter(m => m.type === 'image' || m.type === 'video')
                                    .map((mediaItem, index) => (
                                        <div
                                            key={mediaItem._id || index}
                                            className="media-grid-item"
                                            onClick={() => handleMediaClick(mediaItem)}
                                        >
                                            {mediaItem.type === 'image' ? (
                                                <img
                                                    src={getMediaUrl(mediaItem) || mediaItem.thumbnail}
                                                    alt={mediaItem.filename}
                                                    className="media-thumbnail"
                                                />
                                            ) : (
                                                <div className="video-thumbnail">
                                                    {mediaItem.thumbnail ? (
                                                        <img
                                                            src={mediaItem.thumbnail}
                                                            alt={mediaItem.filename}
                                                            className="media-thumbnail"
                                                        />
                                                    ) : (
                                                        <div className="video-placeholder">
                                                            <span className="video-icon">🎥</span>
                                                        </div>
                                                    )}
                                                    <div className="video-overlay">
                                                        <span className="play-icon">▶️</span>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="media-overlay">
                                                <span className="media-date">
                                                    {formatDate(mediaItem.createdAt)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        )}

                        {/* List Layout for Documents */}
                        {(mediaFilter === 'all' || mediaFilter === 'documents') && (
                            <div className="documents-list">
                                {filteredMedia
                                    .filter(m => m.type === 'document')
                                    .map((doc, index) => (
                                        <div key={doc._id || index} className="document-item">
                                            <div className="document-icon">
                                                {getMediaIcon(doc.type, doc.mimeType)}
                                            </div>
                                            <div className="document-info">
                                                <h4 className="document-name">
                                                    {doc.filename || 'Unknown File'}
                                                </h4>
                                                <p className="document-meta">
                                                    {formatFileSize(doc.size)} • {formatDate(doc.createdAt)}
                                                </p>
                                            </div>
                                            <button
                                                className="download-btn"
                                                onClick={() => handleDownload(doc)}
                                                title="Download"
                                            >
                                                ⬇️
                                            </button>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Full Screen Media Viewer */}
            {selectedMedia && (
                <div className="media-viewer-overlay" onClick={() => setSelectedMedia(null)}>
                    <div className="media-viewer" onClick={(e) => e.stopPropagation()}>
                        <div className="media-viewer-header">
                            <h3>{selectedMedia.filename}</h3>
                            <div className="media-viewer-actions">
                                <button
                                    onClick={() => handleDownload(selectedMedia)}
                                    className="download-btn"
                                    title="Download"
                                >
                                    ⬇️
                                </button>
                                <button
                                    onClick={() => setSelectedMedia(null)}
                                    className="close-btn"
                                    title="Close"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                        
                        <div className="media-viewer-content">
                            {selectedMedia.type === 'image' ? (
                                <img
                                    src={getMediaUrl(selectedMedia)}
                                    alt={selectedMedia.filename}
                                    className="full-media"
                                />
                            ) : selectedMedia.type === 'video' ? (
                                <video
                                    src={getMediaUrl(selectedMedia)}
                                    controls
                                    className="full-media"
                                    autoPlay
                                />
                            ) : (
                                <div className="document-preview">
                                    <div className="document-icon-large">
                                        {getMediaIcon(selectedMedia.type, selectedMedia.mimeType)}
                                    </div>
                                    <h3>{selectedMedia.filename}</h3>
                                    <p>{formatFileSize(selectedMedia.size)}</p>
                                    <button
                                        onClick={() => handleDownload(selectedMedia)}
                                        className="preview-download-btn"
                                    >
                                        Download File
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="media-viewer-info">
                            <p>Sent on {formatDate(selectedMedia.createdAt)}</p>
                            {selectedMedia.size && (
                                <p>Size: {formatFileSize(selectedMedia.size)}</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MediaGallery;