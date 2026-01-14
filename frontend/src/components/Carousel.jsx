import { useEffect, useState } from "react";
import { getImageUrl } from "../utils/imageUrl";

const Carousel = ({ images, interval = 4000, fullWidth = false }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  console.log('Carousel: images prop', images);

  // Only use carousel items that have at least one image source
  const validImages = (images || []).filter(
    (it) => it && (it.imagen_url || it.imagen_mobile_url)
  );

  useEffect(() => {
    console.log('Carousel: validImages', validImages);
    if (!validImages || validImages.length === 0) return;

    // reset index if images changed or current index out of bounds
    setCurrentIndex((prev) => (prev >= validImages.length ? 0 : prev));

    const timer = setInterval(() => {
      setCurrentIndex((prev) =>
        prev === validImages.length - 1 ? 0 : prev + 1
      );
    }, interval);

    return () => clearInterval(timer);
  }, [validImages, interval]);

  if (!images || images.length === 0) {
    return null;
  }

  const currentImage = validImages[currentIndex];

  if (!currentImage) {
    // no hay imágenes válidas: mostrar placeholder leve
    return (
      <div className="carousel" style={{height: '200px', background: '#111'}}>
        {/* empty placeholder */}
      </div>
    );
  }

  const desktopSrc = currentImage.imagen_url ? getImageUrl(currentImage.imagen_url) : null;
  const mobileSrc = currentImage.imagen_mobile_url ? getImageUrl(currentImage.imagen_mobile_url) : null;

  return (
    <div className={`carousel ${fullWidth ? 'full-bleed' : ''}`}>
      {/* Blurred side fill to avoid black bands on wide screens */}
      {(desktopSrc || mobileSrc) && (
        <div
          className="carousel-sides-fill"
          style={{ backgroundImage: `url(${desktopSrc || mobileSrc})` }}
          aria-hidden="true"
        />
      )}

      {/* Use a fixed landscape frame so images keep a consistent aspect ratio */}
      <div className="landscape-frame">
        {/* Use <picture> so browsers on small screens load the mobile variant when available */}
        <picture>
          {mobileSrc && (
            <source media="(max-width: 576px)" srcSet={mobileSrc} />
          )}
          {/* fallback / desktop */}
          <img
            src={desktopSrc || mobileSrc}
            alt={currentImage.titulo || "Imagen carrusel"}
            className="carousel-image"
            loading="lazy"
          />
        </picture>
      </div>

      {currentImage.titulo && (
        <div className="carousel-title">
          {currentImage.titulo}
        </div>
      )}
    </div>
  );
};

export default Carousel;
