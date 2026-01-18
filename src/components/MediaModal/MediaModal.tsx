import styles from './MediaModal.module.css';
import { useState } from 'react';

interface MediaModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageUrl?: string;
    videoUrl?: string;
    galleryUrls?: string[];
    title: string;
}

/**
 * Modal to display product media (Images, Videos, Galleries).
 * 
 * Supports:
 * - Single Image viewing.
 * - Video playback (MP4).
 * - Gallery navigation (multiple images).
 * - Thumbnail navigation to switch between media types.
 * 
 * ---
 * 
 * Modal para mostrar multimedia del producto (Imágenes, Videos, Galerías).
 * 
 * Soporta:
 * - Visualización de imagen única.
 * - Reproducción de video (MP4).
 * - Navegación de galería (múltiples imágenes).
 * - Navegación por miniaturas para cambiar entre tipos de medios.
 */
export function MediaModal({ isOpen, onClose, imageUrl, videoUrl, galleryUrls, title }: MediaModalProps) {
    const [activeMedia, setActiveMedia] = useState<'video' | 'image' | number>(videoUrl ? 'video' : 'image');

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>{title}</h2>
                    <button className={styles.closeButton} onClick={onClose}>&times;</button>
                </div>

                <div className={styles.mediaContainer}>
                    {activeMedia === 'video' && videoUrl && (
                        <video controls autoPlay className={styles.mainMedia}>
                            <source src={videoUrl} type="video/mp4" />
                            Tu navegador no soporta el tag de video.
                        </video>
                    )}
                    {activeMedia === 'image' && imageUrl && (
                        <img src={imageUrl} alt={title} className={styles.mainMedia} />
                    )}
                    {typeof activeMedia === 'number' && galleryUrls && (
                        <img src={galleryUrls[activeMedia]} alt={`${title} ${activeMedia + 1}`} className={styles.mainMedia} />
                    )}
                </div>

                <div className={styles.thumbnailsContainer}>
                    <div className={styles.thumbnails}>
                        {videoUrl && (
                            <div
                                className={`${styles.thumbnail} ${activeMedia === 'video' ? styles.active : ''} ${styles.videoThumbnail}`}
                                onClick={() => setActiveMedia('video')}
                            >
                                <span>▶</span>
                            </div>
                        )}
                        {imageUrl && (
                            <img
                                src={imageUrl}
                                alt="Principal"
                                className={`${styles.thumbnail} ${activeMedia === 'image' ? styles.active : ''}`}
                                onClick={() => setActiveMedia('image')}
                            />
                        )}
                        {galleryUrls?.map((url, idx) => (
                            <img
                                key={idx}
                                src={url}
                                alt={`Gallery ${idx}`}
                                className={`${styles.thumbnail} ${activeMedia === idx ? styles.active : ''}`}
                                onClick={() => setActiveMedia(idx)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
