import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Badge,
  Box,
  Button,
  Center,
  Container,
  Flex,
  FormControl,
  HStack,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Spacer,
  Select,
  SimpleGrid,
  Spinner,
  Switch,
  Text,
  VStack,
  useColorModeValue,
  useDisclosure
} from '@chakra-ui/react';
import { Search, ShoppingBag } from 'lucide-react';
import axios from 'axios';
import ImageWithFallback from '../components/common/ImageWithFallback';

// Plain axios instance — NO auth token, NO 401 redirect interceptor
const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' }
});

export default function PublicStoreCatalog() {
  const { tenantId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('ALL');
  const [inStockOnly, setInStockOnly] = useState(false);
  const { isOpen: isImgOpen, onOpen: onImgOpen, onClose: onImgClose } = useDisclosure();
  const [activeImg, setActiveImg] = useState({ src: '', title: '' });

  const currency = store?.currency || 'INR';
  const formatter = useMemo(() => {
    try {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency });
    } catch {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });
    }
  }, [currency]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await publicApi.get(`/public/stores/${tenantId}/products`);
        if (cancelled) return;
        setStore(res.data.store);
        setProducts(Array.isArray(res.data.products) ? res.data.products : []);
      } catch (e) {
        if (cancelled) return;
        setError(e?.response?.data?.message || 'Could not load store catalog');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (tenantId) load();
    return () => { cancelled = true; };
  }, [tenantId]);

  const bg = useColorModeValue('gray.50', 'gray.900');

  const categories = useMemo(() => {
    const set = new Set();
    for (const p of products) {
      const c = String(p?.category || '').trim();
      if (c) set.add(c);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (inStockOnly && Number(p?.stock || 0) <= 0) return false;
      if (category !== 'ALL' && String(p?.category || '') !== category) return false;
      if (!q) return true;
      const name = String(p?.name || '').toLowerCase();
      return name.includes(q);
    });
  }, [products, query, category, inStockOnly]);

  return (
    <Box minH="100vh" bg={bg} fontFamily="Inter, sans-serif">
      {/* Sticky Header */}
      <Box
        position="sticky"
        top="0"
        zIndex={200}
        bgGradient="linear(to-r, brand.600, brand.800)"
        color="white"
        px={{ base: 4, md: 6 }}
        py={{ base: 3, md: 4 }}
        sx={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}
        borderBottom="1px solid"
        borderColor="whiteAlpha.200"
        backdropFilter="blur(12px)"
      >
        <Container maxW="container.xl">
          <Flex
            align={{ base: 'flex-start', sm: 'center' }}
            direction={{ base: 'column', sm: 'row' }}
            gap={{ base: 2, sm: 4 }}
          >
            <HStack spacing={3} flexShrink={0}>
              <Box
                w="40px"
                h="40px"
                borderRadius="xl"
                bg="whiteAlpha.200"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <ShoppingBag size={20} />
              </Box>
              <VStack spacing={0} align="start" lineHeight="1">
                <Text fontWeight="900" letterSpacing="tight" fontSize={{ base: 'lg', md: 'xl' }}>
                  SME 360
                </Text>
                <Text opacity={0.9} fontSize="xs">
                  Public Catalog
                </Text>
              </VStack>
            </HStack>

            <Spacer display={{ base: 'none', sm: 'block' }} />

            <Box
              textAlign={{ base: 'left', sm: 'right' }}
              w={{ base: '100%', sm: 'auto' }}
              maxW={{ base: '100%', sm: '640px' }}
            >
              <Text opacity={0.9} fontSize="xs">
                Store
              </Text>
              <Heading
                fontWeight="900"
                lineHeight="1.1"
                noOfLines={{ base: 2, md: 1 }}
                title={store?.storeName || store?.name || 'Store Catalog'}
                fontSize="clamp(18px, 4.5vw, 26px)"
              >
                {store?.storeName || store?.name || 'Store Catalog'}
              </Heading>
            </Box>
          </Flex>
        </Container>
      </Box>

      <Container maxW="container.xl" py={10}>
        {loading ? (
          <Center h="300px"><Spinner size="xl" color="brand.500" /></Center>
        ) : error ? (
          <Center h="260px" flexDirection="column" textAlign="center">
            <Heading size="md" mb={2}>Could not load catalog</Heading>
            <Text color="gray.600" mb={6}>{error}</Text>
            <Button onClick={() => navigate('/portal')}>Go back</Button>
          </Center>
        ) : products.length === 0 ? (
          <Center h="260px" flexDirection="column" textAlign="center">
            <Heading size="md" mb={2}>No products yet</Heading>
            <Text color="gray.600">This store hasn’t added products to POS inventory.</Text>
          </Center>
        ) : (
          <Box>
            <Flex
              gap={4}
              mb={6}
              wrap="wrap"
              align={{ base: 'stretch', md: 'end' }}
              justify="space-between"
              direction={{ base: 'column', md: 'row' }}
            >
              <InputGroup maxW={{ base: '100%', md: '420px' }} size="lg" shadow="sm">
                <InputLeftElement><Search color="gray" /></InputLeftElement>
                <Input
                  placeholder="Search products..."
                  bg="white"
                  borderRadius="xl"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </InputGroup>

              <HStack spacing={4} wrap="wrap" align="end" justify="space-between">
                <FormControl minW={{ base: '100%', sm: '260px' }}>
                  <Text fontSize="xs" color="gray.500" mb={1}>Category</Text>
                  <Select
                    bg="white"
                    borderRadius="xl"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    w="100%"
                  >
                    <option value="ALL">All</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl display="flex" alignItems="center" gap={2} w={{ base: '100%', sm: 'auto' }} justifyContent={{ base: 'space-between', sm: 'flex-start' }}>
                  <Switch
                    isChecked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    colorScheme="brand"
                  />
                  <Text fontSize="sm" color="gray.700" fontWeight="600">In stock only</Text>
                </FormControl>
              </HStack>
            </Flex>

            {filteredProducts.length === 0 ? (
              <Center h="220px" flexDirection="column" textAlign="center">
                <Heading size="sm" mb={2}>No matches</Heading>
                <Text color="gray.600">Try a different search or category.</Text>
              </Center>
            ) : (
              <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} gap={6}>
                {filteredProducts.map((p) => (
                  <Box
                    key={p._id || p.sku || p.name}
                    bg="white"
                    borderRadius="2xl"
                    overflow="hidden"
                    shadow="sm"
                    _hover={{ shadow: 'md', transform: 'translateY(-2px)' }}
                    transition="all 0.2s"
                  >
                    <Box
                      h={{ base: '150px', md: '170px' }}
                      bg="gray.50"
                      p={2}
                      onClick={() => {
                        setActiveImg({ src: p.image || '', title: p.name || 'Product' });
                        onImgOpen();
                      }}
                      cursor={p.image ? 'zoom-in' : 'default'}
                      role={p.image ? 'button' : undefined}
                      aria-label={p.image ? `View image for ${p.name}` : undefined}
                    >
                      <ImageWithFallback src={p.image} alt={p.name} w="100%" h="100%" objectFit="contain" />
                    </Box>
                    <Box p={4}>
                      <Heading size="sm" noOfLines={2} color="gray.800">{p.name}</Heading>
                      <HStack mt={2} spacing={2} wrap="wrap">
                        {p.category ? <Badge colorScheme="purple" variant="subtle">{p.category}</Badge> : null}
                      </HStack>
                      <Text mt={3} fontWeight="900" fontSize="lg" color="brand.700">
                        {formatter.format(Number(p.price || 0))}
                      </Text>
                    </Box>
                  </Box>
                ))}
              </SimpleGrid>
            )}
          </Box>
        )}
      </Container>

      <Modal isOpen={isImgOpen} onClose={onImgClose} size={{ base: 'full', md: 'xl' }}>
        <ModalOverlay />
        <ModalContent borderRadius={{ base: 0, md: '2xl' }}>
          <ModalHeader>{activeImg.title || 'Image'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Box
              w="100%"
              h={{ base: '70vh', md: '520px' }}
              bg="gray.50"
              borderRadius="xl"
              overflow="hidden"
              p={3}
            >
              {/* Public view should avoid cropping; use contain */}
              <ImageWithFallback
                src={activeImg.src}
                alt={activeImg.title}
                w="100%"
                h="100%"
                objectFit="contain"
              />
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
