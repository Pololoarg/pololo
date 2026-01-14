import { useEffect, useState } from "react";
import { getHome } from "../services/home.service";
import Carousel from "../components/Carousel";
import FeaturedProducts from "../components/FeaturedProducts";


const Home = () => {
  const [carousel, setCarousel] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHome = async () => {
      try {
        console.log('HomePage: llamando a getHome()');
        const data = await getHome();
        console.log('HomePage: respuesta getHome()', data);

        setCarousel(data?.carousel || []);
        setFeaturedProducts(data?.featuredProducts || []);
      } catch (error) {
        console.error("Error cargando home:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHome();
  }, []);

  if (loading) {
    return <p>Cargando home...</p>;
  }


return (
    <div>
    <Carousel images={carousel} fullWidth />

    <FeaturedProducts products={featuredProducts} />
  </div>
);
};

export default Home;
