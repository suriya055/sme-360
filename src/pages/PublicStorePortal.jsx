import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AspectRatio,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Center,
  Container,
  Divider,
  Flex,
  FormControl,
  HStack,
  Heading,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  SimpleGrid,
  Spinner,
  Switch,
  Text,
  VStack,
  useColorModeValue,
  useDisclosure,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
} from '@chakra-ui/react';
import { LayoutGrid, List, Search, ShoppingBag, Plus, Minus, Trash2, ShoppingCart, MessageCircle, Info } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import ImageWithFallback from '../components/common/ImageWithFallback';

const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' }
});

export default function PublicStorePortal() {
  const { tenantId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('ALL');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState('default');

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [cart, setCart] = useState([]);

  // --- OTP Verification State ---
  const [customerVerified, setCustomerVerified] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState('');
  const [phoneQuery, setPhoneQuery] = useState('');
  const [otp, setOtp] = useState('');
  const [loyaltyLoading, setLoyaltyLoading] = useState(false);

  const currency = store?.currency || 'INR';
  const formatter = useMemo(() => {
    try {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 });
    } catch {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
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
        setError(e?.response?.data?.message || 'Could not load store portal');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (tenantId) load();
    return () => { cancelled = true; };
  }, [tenantId]);

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
    let result = products.filter((p) => {
      if (inStockOnly && Number(p?.stock || 0) <= 0) return false;
      if (category !== 'ALL' && String(p?.category || '') !== category) return false;
      if (!q) return true;
      const name = String(p?.name || '').toLowerCase();
      return name.includes(q);
    });

    if (sortOrder === 'price-asc') {
      result.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    } else if (sortOrder === 'price-desc') {
      result.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    }

    return result;
  }, [products, query, category, inStockOnly, sortOrder]);

  const primary = store?.theme?.primaryColor || '#0ea5e9';
  const secondary = store?.theme?.secondaryColor || '#f59e0b';

  const bg = useColorModeValue('#f8fafc', 'gray.900');
  const surface = useColorModeValue('white', 'gray.800');
  const subtle = useColorModeValue('gray.500', 'gray.400');
  const title = useColorModeValue('gray.900', 'white');
  const border = useColorModeValue('gray.200', 'whiteAlpha.200');

  // --- OTP Verification Logic ---
  const digitsOnly = (v) => String(v || '').replace(/\D/g, '');
  const normalizeWaMeNumber = (digits) => {
    const d = String(digits || '').replace(/\D/g, '');
    if (d.length === 10 && currency === 'INR') return `91${d}`; // India default
    return d;
  };

  const openWhatsAppOtp = () => {
    const trimmed = digitsOnly(phoneQuery);
    if (!trimmed || trimmed.length < 10) return toast.error('Enter a valid phone number (min 10 digits)');

    // OTP must go to the bot number (not the shop owner's ordering number).
    const storePhone = store?.whatsappNumber || '';
    const cleanPhone = normalizeWaMeNumber(storePhone);
    if (!cleanPhone) {
      toast.error('Store WhatsApp bot is not configured.');
      return;
    }

    // Customer gets the verification code by sending OTP inside WhatsApp.
    // If they are new, the bot will first ask their name (formal registration questions).
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent('OTP')}`, '_blank');
  };

  const verifyOtp = async () => {
    const token = digitsOnly(otp);
    if (!/^\d{6}$/.test(token)) return toast.error('Enter the 6-digit OTP.');
    const trimmed = digitsOnly(phoneQuery);
    if (!trimmed || trimmed.length < 10) return toast.error('Enter a valid phone number (min 10 digits)');

    setLoyaltyLoading(true);
    try {
      // WhatsApp OTP flow: verify by phone + otp (no verificationId needed).
      await publicApi.post('/public/loyalty/otp/verify', { phone: trimmed, otp: token });
      setCustomerVerified(true);
      setVerifiedPhone(phoneQuery);
      toast.success('Verified successfully. You may now place your order!');
    } catch (e) {
      toast.error(e?.response?.data?.message || 'OTP verification failed.');
    } finally {
      setLoyaltyLoading(false);
    }
  };


  // --- Cart Helpers ---
  const addToCart = (product) => {
    if (Number(product.stock || 0) <= 0) {
      toast.error('This product is out of stock.');
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item._id === product._id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.error('Cannot add more. Stock limit reached.');
          return prev;
        }
        return prev.map(item => item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    toast.success(`${product.name} added to cart`);
  };

  const updateQuantity = (productId, delta, stockLimit) => {
    setCart(prev => {
      return prev.map(item => {
        if (item._id === productId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null; // handled via removal below
          if (newQty > stockLimit) {
            toast.error('Cannot increase quantity. Stock limit reached.');
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean);
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item._id !== productId));
  };

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotalAmount = cart.reduce((sum, item) => sum + (item.quantity * Number(item.price || 0)), 0);

  const handleWhatsAppCheckout = () => {
    if (cart.length === 0) return;

    let message = `🛒 *New Order - ${store.storeName || 'Store'}*\n`;
    message += `📱 *Customer Confirmed Number:* ${verifiedPhone}\n\n`;
    
    cart.forEach(item => {
      const itemTotal = item.quantity * Number(item.price || 0);
      message += `• *${item.name}*\n  Qty: ${item.quantity}  x  ${formatter.format(Number(item.price || 0))} = ${formatter.format(itemTotal)}\n`;
    });
    
    message += `\n🧾 *Total Amount: ${formatter.format(cartTotalAmount)}*`;
    message += `\n\n📌 *Message from customer:* Please let me know how to proceed with payment and delivery.`;
    
    const encodedMessage = encodeURIComponent(message);
    const storePhone = store?.orderReceivingNumber || store?.whatsappNumber || store?.phone || store?.contactNumber || '';
    const cleanPhone = normalizeWaMeNumber(storePhone);
    
    if (!cleanPhone) {
        toast.error("Contact number unavailable. Please contact the store directly.");
        return;
    }
    
    window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank');
  };

  return (
    <Box minH="100vh" bg={bg} fontFamily="'Inter', system-ui, sans-serif">
      {/* Navbar with Cart */}
      <Box
        position="sticky"
        top={0}
        zIndex={100}
        bg={useColorModeValue('rgba(255,255,255,0.9)', 'rgba(17,24,39,0.9)')}
        backdropFilter="blur(16px)"
        borderBottom="1px solid"
        borderColor={border}
        boxShadow="sm"
      >
        <Container maxW="container.xl" py={3}>
          <Flex align="center" justify="space-between" gap={4}>
            <HStack spacing={3}>
              <Box
                w="42px"
                h="42px"
                borderRadius="lg"
                bgGradient={`linear(to-br, ${primary}, ${secondary})`}
                display="grid"
                placeItems="center"
                color="white"
                overflow="hidden"
                shadow="md"
              >
                {store?.logoUrl ? (
                  <ImageWithFallback src={store.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <ShoppingBag size={20} />
                )}
              </Box>
              <Box>
                <Text fontWeight="800" fontSize="lg" color={title} lineHeight="1.1">
                  {store?.storeName || store?.name || 'Catalog'}
                </Text>
                <Text fontSize="xs" fontWeight="500" color={subtle}>
                  Official Store
                </Text>
              </Box>
            </HStack>

            <Button
              variant="solid"
              colorScheme="brand"
              bg={primary}
              color="white"
              _hover={{ opacity: 0.9 }}
              leftIcon={<ShoppingCart size={18} />}
              onClick={onOpen}
              position="relative"
              borderRadius="full"
              px={6}
            >
              Cart
              {cartItemsCount > 0 && (
                <Badge
                  position="absolute"
                  top="-2px"
                  right="-2px"
                  bg="red.500"
                  color="white"
                  borderRadius="full"
                  px={2}
                  py={1}
                  fontSize="2xs"
                  border="2px solid white"
                >
                  {cartItemsCount}
                </Badge>
              )}
            </Button>
          </Flex>
        </Container>
      </Box>

      {/* Main E-commerce Layout */}
      <Container maxW="container.xl" py={{ base: 6, md: 8 }}>
        {loading ? (
          <Center h="300px"><Spinner size="xl" thickness="4px" color={primary} /></Center>
        ) : error ? (
          <Center h="260px" flexDirection="column" textAlign="center">
            <Info size={48} color="gray" />
            <Heading size="md" mt={4} mb={2}>Store Error</Heading>
            <Text color={subtle}>{error}</Text>
          </Center>
        ) : products.length === 0 ? (
          <Center h="400px" flexDirection="column" textAlign="center" bg={surface} borderRadius="2xl" shadow="sm">
            <PackageOpen size={64} color="gray" />
            <Heading size="md" mt={4} mb={2} color={title}>No Products Available</Heading>
            <Text color={subtle}>This store hasn't published any products to their public catalog yet.</Text>
          </Center>
        ) : (
          <GridTemplate 
            primary={primary} 
            title={title} 
            subtle={subtle} 
            surface={surface} 
            bg={bg} 
            border={border} 
            query={query} setQuery={setQuery}
            category={category} setCategory={setCategory}
            categories={categories}
            inStockOnly={inStockOnly} setInStockOnly={setInStockOnly}
            sortOrder={sortOrder} setSortOrder={setSortOrder}
            filteredProducts={filteredProducts}
            formatter={formatter}
            addToCart={addToCart}
          />
        )}
      </Container>

      {/* Cart Drawer */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
        <DrawerOverlay backdropFilter="blur(4px)" />
        <DrawerContent bg={surface}>
          <DrawerCloseButton mt={1} />
          <DrawerHeader borderBottomWidth="1px" borderColor={border} color={title} fontWeight="800">
            Your Cart ({cartItemsCount})
          </DrawerHeader>

          <DrawerBody p={0} bg={bg}>
            {cart.length === 0 ? (
              <Center h="100%" flexDirection="column" p={6} textAlign="center">
                <ShoppingCart size={48} color="#cbd5e1" />
                <Heading size="md" mt={4} color={title}>Your cart is empty</Heading>
                <Text mt={2} color={subtle}>Add items from the catalog to start an order.</Text>
                <Button mt={6} colorScheme="gray" onClick={onClose} borderRadius="full">
                  Browse Catalog
                </Button>
              </Center>
            ) : (
              <VStack align="stretch" spacing={0} divider={<Divider borderColor={border} />}>
                {cart.map(item => (
                  <Flex key={item._id} p={4} bg={surface} align="center" gap={4}>
                    <AspectRatio ratio={1} w="70px" flexShrink={0} borderRadius="md" overflow="hidden" bg="gray.50">
                      <ImageWithFallback src={item.image} alt={item.name} objectFit="cover" />
                    </AspectRatio>
                    <Box flex="1">
                      <Text fontWeight="700" color={title} noOfLines={1}>{item.name}</Text>
                      <Text fontSize="sm" color={primary} fontWeight="800">
                        {formatter.format(Number(item.price || 0))}
                      </Text>
                      <HStack mt={2} spacing={3}>
                        <HStack border="1px solid" borderColor={border} borderRadius="full" p={0.5}>
                          <IconButton size="xs" variant="ghost" icon={<Minus size={14} />} borderRadius="full" aria-label="decrease" onClick={() => updateQuantity(item._id, -1, Number(item.stock || 0))} />
                          <Text fontSize="sm" w="5" textAlign="center" fontWeight="700">{item.quantity}</Text>
                          <IconButton size="xs" variant="ghost" icon={<Plus size={14} />} borderRadius="full" aria-label="increase" onClick={() => updateQuantity(item._id, 1, Number(item.stock || 0))} />
                        </HStack>
                        <IconButton size="sm" variant="ghost" colorScheme="red" icon={<Trash2 size={16}/>} aria-label="remove" onClick={() => removeFromCart(item._id)} />
                      </HStack>
                    </Box>
                    <Box textAlign="right" fontWeight="700" color={title}>
                      {formatter.format(item.quantity * Number(item.price || 0))}
                    </Box>
                  </Flex>
                ))}
              </VStack>
            )}
          </DrawerBody>

          <DrawerFooter borderTopWidth="1px" borderColor={border} bg={surface} display="flex" flexDirection="column" alignItems="stretch" p={5}>
            <Flex justify="space-between" align="center" mb={4}>
              <Text fontSize="lg" fontWeight="600" color={subtle}>Subtotal</Text>
              <Text fontSize="2xl" fontWeight="900" color={title}>{formatter.format(cartTotalAmount)}</Text>
            </Flex>

             {!customerVerified && cart.length > 0 ? (
               <Box w="full" bg={useColorModeValue('gray.50', 'whiteAlpha.100')} p={4} borderRadius="xl" border="1px solid" borderColor={border}>
                 <Text fontSize="sm" fontWeight="700" mb={3} color={title}>
                   Verify your number to checkout
                 </Text>
                 <VStack spacing={3}>
                   <Input
                     placeholder="Mobile number"
                     value={phoneQuery}
                     onChange={(e) => setPhoneQuery(e.target.value)}
                     type="tel"
                     bg={surface}
                     borderRadius="lg"
                   />
                   <Button
                     w="full"
                     colorScheme="whatsapp"
                     onClick={openWhatsAppOtp}
                     isLoading={loyaltyLoading}
                   >
                     Get code on WhatsApp
                   </Button>
                   <Text fontSize="xs" color={subtle} textAlign="center">
                     New customer? The bot will ask your name first. After registration, send OTP again.
                   </Text>
                   <Input
                     placeholder="6-digit code from WhatsApp"
                     value={otp}
                     onChange={(e) => setOtp(e.target.value)}
                     type="tel"
                     maxLength={6}
                     bg={surface}
                     borderRadius="lg"
                   />
                   <Button
                     w="full"
                     colorScheme="green"
                     onClick={verifyOtp}
                     isLoading={loyaltyLoading}
                   >
                     Verify & Checkout
                   </Button>
                 </VStack>
               </Box>
             ) : (
              <Box>
                <Button
                  w="full"
                  size="lg"
                  colorScheme="whatsapp"
                  bg="#25D366"
                  _hover={{ bg: '#1EBE57' }}
                  borderRadius="xl"
                  leftIcon={<MessageCircle size={20} />}
                  onClick={handleWhatsAppCheckout}
                  isDisabled={cart.length === 0}
                >
                  Order via WhatsApp
                </Button>
                <Text fontSize="xs" textAlign="center" color={subtle} mt={3}>
                  You will be redirected to WhatsApp to finalize payment and delivery with the store.
                </Text>
              </Box>
            )}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Box>
  );
}

// Separate component for the Main grid to keep it clean
function GridTemplate({ primary, title, subtle, surface, border, query, setQuery, category, setCategory, categories, inStockOnly, setInStockOnly, sortOrder, setSortOrder, filteredProducts, formatter, addToCart }) {
  return (
    <Flex direction={{ base: 'column', lg: 'row' }} gap={8} align="start">
      {/* Sidebar Filters */}
      <Box w={{ base: '100%', lg: '280px' }} position="sticky" top="80px">
        <Card bg={surface} shadow="sm" borderRadius="2xl" border="1px solid" borderColor={border}>
          <CardBody p={5}>
            <VStack align="stretch" spacing={5}>
              <Box>
                <Text fontWeight="800" fontSize="sm" color={title} mb={3} textTransform="uppercase" letterSpacing="widest">
                  Search
                </Text>
                <InputGroup>
                  <InputLeftElement pointerEvents="none"><Search size={16} color="gray" /></InputLeftElement>
                  <Input 
                    placeholder="Search products..." 
                    value={query} 
                    onChange={(e) => setQuery(e.target.value)}
                    borderRadius="lg"
                    bg={useColorModeValue('gray.50', 'whiteAlpha.100')}
                    border="0"
                    _focus={{ ring: 2, ringColor: primary }}
                  />
                </InputGroup>
              </Box>
              <Divider borderColor={border} />
              
              <Box>
                <Text fontWeight="800" fontSize="sm" color={title} mb={3} textTransform="uppercase" letterSpacing="widest">
                  Categories
                </Text>
                <VStack align="stretch" spacing={1}>
                  <Button 
                    variant={category === 'ALL' ? 'solid' : 'ghost'} 
                    justifyContent="flex-start" 
                    bg={category === 'ALL' ? primary : 'transparent'} 
                    color={category === 'ALL' ? 'white' : subtle}
                    _hover={{ bg: category === 'ALL' ? primary : useColorModeValue('gray.100', 'whiteAlpha.200') }}
                    onClick={() => setCategory('ALL')}
                    size="sm"
                    borderRadius="md"
                  >
                    All Products
                  </Button>
                  {categories.map(c => (
                    <Button 
                      key={c}
                      variant={category === c ? 'solid' : 'ghost'} 
                      justifyContent="flex-start" 
                      bg={category === c ? primary : 'transparent'} 
                      color={category === c ? 'white' : subtle}
                      _hover={{ bg: category === c ? primary : useColorModeValue('gray.100', 'whiteAlpha.200') }}
                      onClick={() => setCategory(c)}
                      size="sm"
                      borderRadius="md"
                    >
                      {c}
                    </Button>
                  ))}
                </VStack>
              </Box>
              <Divider borderColor={border} />
              
              <Box>
                <Text fontWeight="800" fontSize="sm" color={title} mb={3} textTransform="uppercase" letterSpacing="widest">
                  Sort & Filter
                </Text>
                <VStack align="stretch" spacing={4}>
                  <Select 
                    value={sortOrder} 
                    onChange={e => setSortOrder(e.target.value)} 
                    borderRadius="lg" 
                    bg={useColorModeValue('gray.50', 'whiteAlpha.100')} 
                    border="0"
                  >
                    <option value="default">Relevance</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                  </Select>

                  <FormControl display="flex" alignItems="center" justify="space-between">
                    <Text fontSize="sm" fontWeight="600" color={title}>In Stock Only</Text>
                    <Switch colorScheme="brand" isChecked={inStockOnly} onChange={e => setInStockOnly(e.target.checked)} />
                  </FormControl>
                </VStack>
              </Box>
            </VStack>
          </CardBody>
        </Card>
      </Box>

      {/* Product Grid */}
      <Box flex="1" w="100%">
        <Flex justify="space-between" align="center" mb={6}>
          <Heading size="md" color={title} fontWeight="800">
            {category === 'ALL' ? 'All Products' : category}
            <Text as="span" fontSize="sm" color={subtle} fontWeight="500" ml={2}>
              ({filteredProducts.length} items)
            </Text>
          </Heading>
        </Flex>

        {filteredProducts.length === 0 ? (
          <Center h="300px" flexDirection="column" textAlign="center" bg={surface} borderRadius="2xl" border="1px dashed" borderColor={border}>
            <Search size={48} color="#cbd5e1" />
            <Heading size="sm" mt={4} mb={2} color={title}>No matching products</Heading>
            <Text color={subtle}>Try adjusting your filters or search query.</Text>
            <Button mt={4} variant="outline" onClick={() => { setQuery(''); setCategory('ALL'); setInStockOnly(false); }}>
              Reset Filters
            </Button>
          </Center>
        ) : (
          <SimpleGrid columns={{ base: 2, md: 3, xl: 4 }} gap={{ base: 4, md: 6 }}>
            {filteredProducts.map(p => {
              const inStock = Number(p.stock || 0) > 0;
              return (
                <Card 
                  key={p._id} 
                  bg={surface} 
                  border="1px solid" 
                  borderColor={border} 
                  borderRadius="2xl" 
                  overflow="hidden"
                  shadow="sm"
                  transition="all 0.2s"
                  _hover={{ shadow: 'xl', transform: 'translateY(-4px)' }}
                >
                  <Box position="relative">
                    <AspectRatio ratio={1} bg={useColorModeValue('gray.50', 'whiteAlpha.100')}>
                      <ImageWithFallback src={p.image} alt={p.name} objectFit="cover" />
                    </AspectRatio>
                    {!inStock && (
                      <Center position="absolute" inset={0} bg="blackAlpha.600" backdropFilter="blur(2px)">
                        <Badge colorScheme="red" variant="solid" px={3} py={1} borderRadius="full" fontSize="sm">
                          OUT OF STOCK
                        </Badge>
                      </Center>
                    )}
                  </Box>
                  <CardBody p={4} display="flex" flexDirection="column">
                    <Text fontSize="xs" color={subtle} textTransform="uppercase" letterSpacing="wide" fontWeight="700" mb={1} noOfLines={1}>
                      {p.category || 'Catalog'}
                    </Text>
                    <Text fontWeight="800" color={title} noOfLines={2} fontSize="sm" mb={2} lineHeight="1.3">
                      {p.name}
                    </Text>
                    <Box mt="auto" pt={3}>
                      <Text fontWeight="900" fontSize="lg" color={primary} mb={3}>
                        {formatter.format(Number(p.price || 0))}
                      </Text>
                      <Button 
                        w="full" 
                        size="sm" 
                        colorScheme={inStock ? "brand" : "gray"}
                        bg={inStock ? primary : undefined}
                        color={inStock ? 'white' : undefined}
                        isDisabled={!inStock}
                        onClick={() => addToCart(p)}
                        borderRadius="xl"
                        leftIcon={<ShoppingCart size={14} />}
                      >
                        Add to Cart
                      </Button>
                    </Box>
                  </CardBody>
                </Card>
              );
            })}
          </SimpleGrid>
        )}
      </Box>
    </Flex>
  );
}
