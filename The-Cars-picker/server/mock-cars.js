const cars = [
  {
    id: 1,
    title: 'Toyota RAV4',
    brand: 'Toyota',
    model: 'RAV4',
    year: 2018,
    price: 1850000,
    body_type: 'SUV',
    mileage: 75000,
    fuel_type: 'petrol',
    transmission: 'automatic',
    city: 'Москва',
    image:
      'https://avatars.mds.yandex.net/get-autoru-vos/4944833/bdf5e6f375be73ba4d2ebd5626ccd4c5/1200x900',
    tags: ['comfort', 'family', 'big_trunk'],
    description:
      'Комфортный семейный кроссовер с высоким клиренсом и просторным салоном.',
  },
  {
    id: 2,
    title: 'Kia Sportage',
    brand: 'Kia',
    model: 'Sportage',
    year: 2019,
    price: 2100000,
    body_type: 'crossover',
    mileage: 60000,
    fuel_type: 'petrol',
    transmission: 'automatic',
    city: 'Санкт-Петербург',
    image:
      'https://yandex-images.clstorage.net/4yk7uX232/0418a0R6W/ykTQHr7Gwym7g0IsGRwRp7etQyOedN4dthsCUJlSbhxk6cxOGs0LUjU1ZSTnjKSZ-K-fWnMqwzDniQ5X-TBi3p4IlCLim5Ik2oIbBQwgLP_qjG5GmyGDPc5Cc0DlsobJ1GVkou4hwsLVbSwhpvmk4PG6Ppo-nrIw07EfrhGFGp7SzJG_H_abSW9niuhI8IGzMpHPL7asWlAedzollfI-RdxNSBq-TZai0dHocdaxSYTRCv4jEqa-aFtNUwopQVoCymBR29c6E7Wz39bU6Gx1Z0p9KzMyQHL47qsiQTEmXglw0SgO7hFupvENCCF26VVECaqOR6o6-rgnwSsyfYmSYnJI3duf8hfpk7eWvIAoqQMSvU9j9jxWcAoTWp2NauqFCK0ogp5NltapJZgBso3VmJWm1muSlhLAo92Xqo1hknJKYDkj1_KHOTdXBkhAeAnnkp1HbxasVlAKS45NjfpuiQzxEM52JWKm6YVoFQ5F3ZCR3o7TMnaSUM9FPy4lcW7e0sxJrztaD3kzZwJM5Gy9-zJdx09qvBYwau_etalCulHEIaim4klu8qU94MFe3R1oNb6aS_aq9ijTVUsufW12LoJA1d9HQift35_-UHiEFTtqNcP_stzqxDYHGq0tdnZJwEE0OvoJGlL1EbS1ssGdzLF-VifyQn5s61lL9rFl6nIGTBnnr-LL_aPP4nDM6CEr6tWruyK8kujuA6IRnUoa1cxdWJK2vVY-PcF8cZb15bAFYsZjHvZm7N_Rb44BuSLaMtQJa89C56kjY-JwAJDFI-bBIw96bI64Rqc2iTFa6vn8Kcy-etECsmUddCUqud2APYaG33IaTgB3hY-6kf2CdnpYkcsXQqMlM8sWvJisxWsy_e8vnsxutJqv9hWBckZZ4L1YCjKdyspdORQ5eqn5hC3aTtuGwk5AK2Vvvm3hGsq23EW_W9rj5RfHDrzQvGmbxtkLL2L4fvgqAxKdaXZg',
    tags: ['family', 'comfort'],
    description:
      'Современный кроссовер с хорошей шумоизоляцией и богатой комплектацией.',
  },
  {
    id: 3,
    title: 'Skoda Octavia',
    brand: 'Skoda',
    model: 'Octavia',
    year: 2017,
    price: 1350000,
    body_type: 'sedan',
    mileage: 90000,
    fuel_type: 'petrol',
    transmission: 'automatic',
    city: 'Новосибирск',
    image:
      'https://avatars.mds.yandex.net/get-autoru-vos/2142060/e0c8aaf98a3f1e0c9db0902a07d27b7f/1200x900',
    tags: ['economy', 'family', 'big_trunk'],
    description: 'Практичный семейный седан с большим багажником и экономичным двигателем.',
  },
  {
    id: 4,
    title: 'Volkswagen Golf',
    brand: 'Volkswagen',
    model: 'Golf',
    year: 2016,
    price: 1100000,
    body_type: 'hatchback',
    mileage: 100000,
    fuel_type: 'petrol',
    transmission: 'manual',
    city: 'Екатеринбург',
    image:
      'https://avatars.mds.yandex.net/get-autoru-vos/1887810/7e30b75846f29ae6bda2567ef14f2d26/1200x900',
    tags: ['economy', 'city'],
    description: 'Компактный и экономичный хэтчбек для города.',
  },
  {
    id: 5,
    title: 'Hyundai Santa Fe',
    brand: 'Hyundai',
    model: 'Santa Fe',
    year: 2020,
    price: 2600000,
    body_type: 'SUV',
    mileage: 40000,
    fuel_type: 'diesel',
    transmission: 'automatic',
    city: 'Казань',
    image:
      'https://yandex-images.clstorage.net/4yk7uX232/0418a0AP6/nlyZJ4eyikmLwwtcMCAdp-70Hx-yNfZZ8gcHdMVDMkQM-YFfaoAfLmhEbBWzsKC4oKeDImJm2z2_iRMSURQLl9tB1CbWn_NVi9dacBkQdZeuoS9qvmD-PeIaY0TpsobJ1GVkou4hwsLVbSwhpvmk4PG6Ppo-nrIw07EfrhGFGp7SzJG_H_abSW9niuhI8IGzMpHPL7asWlAedzollfI-RdxNSBq-TZai0dHocdaxSYTRCv4jEqa-aFtNUwopQVoCymBR29c6E7Wz39bU6Gx1Z0p9KzMyQHL47qsiQTEmXglw0SgO7hFupvENCCF26VVECaqOR6o6-rgnwSsyfYmSYnJI3duf8hfpk7eWvIAoqQMSvU9j9jxWcAoTWp2NauqFCK0ogp5NltapJZgBso3VmJWm1muSlhLAo92Xqo1hknJKYDkj1_KHOTdXBkhAeAnnkp1HbxasVlAKS45NjfpuiQzxEM52JWKm6YVoFQ5F3ZCR3o7TMnaSUM9FPy4lcW7e0sxJrztaD3kzZwJM5Gy9-zJdx09qvBYwau_etalCulHEIaim4klu8qU94MFe3R1oNb6aS_aq9ijTVUsufW12LoJA1d9HQift35_-UHiEFTtqNcP_stzqxDYHGq0tdnZJwEE0OvoJGlL1EbS1ssGdzLF-VifyQn5s61lL9rFl6nIGTBnnr-LL_aPP4nDM6CEr6tWruyK8kujuA6IRnUoa1cxdWJK2vVY-PcF8cZb15bAFYsZjHvZm7N_Rb44BuSLaMtQJa89C56kjY-JwAJDFI-bBIw96bI64Rqc2iTFa6vn8Kcy-etECsmUddCUqud2APYaG33IaTgB3hY-6kf2CdnpYkcsXQqMlM8sWvJisxWsy_e8vnsxutJqv9hWBckZZ4L1YCjKdyspdORQ5eqn5hC3aTtuGwk5AK2Vvvm3hGsq23EW_W9rj5RfHDrzQvGmbxtkLL2L4fvgqAxKdaXZg',
    tags: ['family', 'comfort', 'big_trunk'],
    description: 'Большой семейный внедорожник с экономичным дизелем.',
  },
];

export default cars;


