import React, { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Center,
  Container,
  Divider,
  Flex,
  Heading,
  HStack,
  Image,
  Input,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
  Spinner,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useColorModeValue,
  VStack,
} from '@chakra-ui/react';
import {
  ArrowRight,
  Calendar as CalendarIcon,
  Gift,
  Phone,
  Search,
  ShieldCheck,
  ShoppingBag,
  Ticket,
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// Plain axios instance — NO auth token, NO 401 redirect interceptor
// This ensures unauthenticated customers (portal visitors) never get kicked to /login
const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

export default function PublicPortal() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eventQuery, setEventQuery] = useState('');

  // Loyalty Lookup State (OTP-gated global shop list)
  const [phoneQuery, setPhoneQuery] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [otp, setOtp] = useState('');
  const [shops, setShops] = useState([]);
  const [loyaltyStep, setLoyaltyStep] = useState('phone'); // phone | otp | results
  const [loyaltyLoading, setLoyaltyLoading] = useState(false);

  useEffect(() => {
    const fetchPublicData = async () => {
      setLoading(true);
      try {
        const eventRes = await publicApi.get('/events/public');
        setEvents(Array.isArray(eventRes.data) ? eventRes.data : []);
      } catch (error) {
        console.error('Failed to load portal data:', error?.message || error);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicData();
  }, []);

  const filteredEvents = useMemo(() => {
    const list = Array.isArray(events) ? events : [];
    const q = eventQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((evt) => {
      return [evt?.title, evt?.description, evt?.location]
        .filter(Boolean)
        .some((s) => String(s).toLowerCase().includes(q));
    });
  }, [events, eventQuery]);

  const digitsOnly = (v) => String(v || '').replace(/\D/g, '');

  const startOtp = async () => {
    const trimmed = digitsOnly(phoneQuery);
    if (!trimmed || trimmed.length < 10) {
      toast.error('Enter a valid phone number (min 10 digits)');
      return;
    }

    setLoyaltyLoading(true);
    try {
      const res = await publicApi.post('/public/loyalty/otp/start', { phone: trimmed });
      const vid = res?.data?.verificationId || '';
      if (!vid) {
        toast.success('OTP sent (if an account exists).');
        return;
      }
      setVerificationId(vid);
      setOtp('');
      setShops([]);
      setLoyaltyStep('otp');
      toast.success('OTP sent (if an account exists).');
    } catch (e) {
      toast.error('Could not send OTP. Please try again.');
    } finally {
      setLoyaltyLoading(false);
    }
  };

  const verifyOtp = async () => {
    const token = digitsOnly(otp);
    if (!verificationId) return toast.error('Please request an OTP first.');
    if (!/^\d{6}$/.test(token)) return toast.error('Enter the 6-digit OTP.');

    setLoyaltyLoading(true);
    try {
      const res = await publicApi.post('/public/loyalty/otp/verify', { verificationId, otp: token });
      const list = Array.isArray(res?.data?.shops) ? res.data.shops : [];
      setShops(list);
      setLoyaltyStep('results');
    } catch (e) {
      toast.error(e?.response?.data?.message || 'OTP verification failed.');
    } finally {
      setLoyaltyLoading(false);
    }
  };

  const bg = useColorModeValue('#fbfbfc', 'gray.900');
  const surface = useColorModeValue('white', 'gray.800');
  const subtle = useColorModeValue('gray.600', 'gray.300');
  const title = useColorModeValue('gray.900', 'white');
  const border = useColorModeValue('blackAlpha.100', 'whiteAlpha.200');

  return (
    <Box minH="100vh" bg={bg} fontFamily="system-ui, -apple-system, Segoe UI, Roboto, sans-serif">
      {/* Top Bar */}
      <Box
        position="sticky"
        top={0}
        zIndex={50}
        bg={useColorModeValue('rgba(251,251,252,0.88)', 'rgba(17,24,39,0.78)')}
        backdropFilter="blur(10px)"
        borderBottom="1px solid"
        borderColor={border}
      >
        <Container maxW="container.xl" py={3}>
          <Flex align="center" justify="space-between" gap={4}>
            <HStack spacing={3}>
              <Box
                w="38px"
                h="38px"
                borderRadius="14px"
                bgGradient="linear(to-br, brand.600, brand.400)"
                display="grid"
                placeItems="center"
                color="white"
                boxShadow="md"
              >
                <ShoppingBag size={18} />
              </Box>
              <Box>
                <Text fontWeight="800" letterSpacing="-0.02em" color={title} lineHeight="1.1">
                  SME 360 Mall
                </Text>
                <Text fontSize="xs" color={subtle}>
                  Events, offers, and rewards
                </Text>
              </Box>
            </HStack>

            {/* Customer-first header: keep it clean, no duplicate nav buttons here. */}
          </Flex>
        </Container>
      </Box>

      {/* Hero */}
      <Box position="relative" overflow="hidden">
        <Box
          position="absolute"
          inset={0}
          bgGradient={useColorModeValue(
            'radial(900px circle at 15% -10%, rgba(14,165,233,0.28), transparent 55%), radial(900px circle at 85% 0%, rgba(245,158,11,0.22), transparent 55%)',
            'radial(900px circle at 15% -10%, rgba(14,165,233,0.18), transparent 55%), radial(900px circle at 85% 0%, rgba(245,158,11,0.14), transparent 55%)'
          )}
        />
        <Container maxW="container.xl" py={{ base: 10, md: 14 }} position="relative">
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={{ base: 10, md: 12 }} alignItems="center">
            <VStack align="start" spacing={5}>
              <Badge
                px={3}
                py={1}
                borderRadius="full"
                colorScheme="brand"
                variant="subtle"
                display="inline-flex"
                alignItems="center"
                gap={2}
              >
                <ShieldCheck size={14} />
                Official mall updates
              </Badge>
              <Heading
                fontSize={{ base: '3xl', md: '5xl' }}
                letterSpacing="-0.04em"
                lineHeight="1.05"
                color={title}
                fontWeight="900"
              >
                Discover what’s on today.
              </Heading>
              <Text fontSize={{ base: 'md', md: 'lg' }} color={subtle} maxW="42ch">
                Browse upcoming events, limited-time offers, and check your rewards in one place.
              </Text>
              <Button
                colorScheme="brand"
                size="lg"
                leftIcon={<Ticket size={18} />}
                onClick={() => {
                  setActiveTab(0);
                  const el = document.getElementById('mall-tabs');
                  if (el && typeof el.scrollIntoView === 'function') el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              >
                Explore updates
              </Button>
            </VStack>

            <Card bg={surface} border="1px solid" borderColor={border} borderRadius="2xl" boxShadow="xl">
              <CardBody p={{ base: 5, md: 6 }}>
                <VStack align="stretch" spacing={4}>
                  <HStack justify="space-between">
                    <Text fontWeight="800" color={title}>
                      Quick Search
                    </Text>
                    <Badge variant="subtle" colorScheme="gray" borderRadius="full">
                      Public
                    </Badge>
                  </HStack>
                  <InputGroup size="lg">
                    <InputLeftElement>
                      <Search size={18} />
                    </InputLeftElement>
                    <Input
                      value={eventQuery}
                      onChange={(e) => setEventQuery(e.target.value)}
                      placeholder="Search events, offers, locations..."
                      bg={useColorModeValue('gray.50', 'whiteAlpha.100')}
                      borderColor={border}
                      borderRadius="xl"
                    />
                  </InputGroup>
                  <Divider borderColor={border} />
                  <HStack justify="space-between" color={subtle} fontSize="sm">
                    <HStack spacing={2}>
                      <CalendarIcon size={16} />
                      <Text>Live announcements</Text>
                    </HStack>
                    <Text fontWeight="700">{filteredEvents.length} items</Text>
                  </HStack>
                </VStack>
              </CardBody>
            </Card>
          </SimpleGrid>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxW="container.xl" py={{ base: 10, md: 12 }}>
        <Tabs id="mall-tabs" variant="unstyled" index={activeTab} onChange={setActiveTab}>
          <TabList
            bg={surface}
            border="1px solid"
            borderColor={border}
            borderRadius="2xl"
            p={2}
            boxShadow="lg"
            overflowX="auto"
            sx={{ '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none' }}
          >
            <Tab
              flexShrink={0}
              borderRadius="xl"
              px={5}
              py={3}
              fontWeight="800"
              color={subtle}
              _selected={{ bg: useColorModeValue('gray.900', 'white'), color: useColorModeValue('white', 'gray.900') }}
            >
              <HStack spacing={2}>
                <CalendarIcon size={16} />
                <Text>Events</Text>
              </HStack>
            </Tab>
            <Tab
              flexShrink={0}
              borderRadius="xl"
              px={5}
              py={3}
              fontWeight="800"
              color={subtle}
              _selected={{ bg: useColorModeValue('gray.900', 'white'), color: useColorModeValue('white', 'gray.900') }}
            >
              <HStack spacing={2}>
                <Gift size={16} />
                <Text>Rewards</Text>
              </HStack>
            </Tab>
          </TabList>

          {loading ? (
            <Center h="300px">
              <Spinner size="xl" color="brand.500" />
            </Center>
          ) : (
            <TabPanels mt={8}>
              <TabPanel px={0}>
                <Flex align="center" justify="space-between" mb={5} gap={4} flexWrap="wrap">
                  <Box>
                    <Heading size="lg" color={title} letterSpacing="-0.02em">
                      Events and offers
                    </Heading>
                    <Text color={subtle}>What’s happening across the mall right now.</Text>
                  </Box>
                  <InputGroup maxW={{ base: 'full', md: '360px' }}>
                    <InputLeftElement>
                      <Search size={16} />
                    </InputLeftElement>
                    <Input
                      value={eventQuery}
                      onChange={(e) => setEventQuery(e.target.value)}
                      placeholder="Search events..."
                      bg={surface}
                      borderColor={border}
                      borderRadius="xl"
                    />
                  </InputGroup>
                </Flex>

                {filteredEvents.length === 0 ? (
                  <Card bg={surface} border="1px solid" borderColor={border} borderRadius="2xl">
                    <CardBody p={{ base: 6, md: 8 }}>
                      <VStack spacing={2} textAlign="center">
                        <Heading size="md" color={title}>
                          No events found
                        </Heading>
                        <Text color={subtle}>Try a different search or check back later.</Text>
                        <Button variant="outline" onClick={() => setEventQuery('')}>
                          Clear search
                        </Button>
                      </VStack>
                    </CardBody>
                  </Card>
                ) : (
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                    {filteredEvents.map((evt) => (
                      <Card
                        key={evt?._id || evt?.id || `${evt?.title}-${evt?.startDate}`}
                        bg={surface}
                        border="1px solid"
                        borderColor={border}
                        borderRadius="2xl"
                        overflow="hidden"
                        boxShadow="md"
                        _hover={{ transform: 'translateY(-2px)', boxShadow: 'xl' }}
                        transition="all 0.18s ease"
                      >
                        {evt?.bannerUrl ? (
                          <Image src={evt.bannerUrl} alt={evt?.title || 'Event banner'} w="100%" h="160px" objectFit="cover" />
                        ) : (
                          <Box h="160px" bgGradient="linear(to-br, brand.100, orange.50)" />
                        )}
                        <CardBody p={5}>
                          <VStack align="stretch" spacing={3}>
                            <HStack justify="space-between">
                              <Badge
                                colorScheme={evt?.status === 'published' ? 'green' : 'gray'}
                                borderRadius="full"
                                px={3}
                                py={1}
                              >
                                {String(evt?.status || 'published').toUpperCase()}
                              </Badge>
                              <HStack spacing={2} color={subtle} fontSize="xs">
                                <CalendarIcon size={14} />
                                <Text>
                                  {evt?.startDate ? new Date(evt.startDate).toLocaleDateString() : '—'}
                                  {evt?.endDate ? ` · ${new Date(evt.endDate).toLocaleDateString()}` : ''}
                                </Text>
                              </HStack>
                            </HStack>
                            <Heading size="md" color={title} noOfLines={2}>
                              {evt?.title || 'Untitled event'}
                            </Heading>
                            <Text color={subtle} fontSize="sm" noOfLines={3}>
                              {evt?.description || 'Details will be announced soon.'}
                            </Text>
                            <HStack justify="space-between" pt={1} color={subtle} fontSize="sm">
                              <Text fontWeight="700" color={useColorModeValue('brand.700', 'brand.200')}>
                                {evt?.location || (evt?.isMallWide ? 'Mall-wide' : 'In-store')}
                              </Text>
                              <Button size="sm" variant="ghost" onClick={() => toast('Details view can be added next.')}>
                                View
                              </Button>
                            </HStack>
                          </VStack>
                        </CardBody>
                      </Card>
                    ))}
                  </SimpleGrid>
                )}
              </TabPanel>

              <TabPanel px={0}>
                <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} alignItems="start">
                  <Card bg={surface} border="1px solid" borderColor={border} borderRadius="2xl" boxShadow="lg" overflow="hidden">
                    <Box bgGradient="linear(to-r, brand.600, brand.500)" color="white" p={{ base: 6, md: 7 }}>
                      <Heading size="lg" letterSpacing="-0.02em">
                        Rewards
                      </Heading>
                      <Text opacity={0.92}>Check your points balance using your phone number.</Text>
                    </Box>
                    <CardBody p={{ base: 6, md: 7 }}>
                      {loyaltyStep === 'phone' ? (
                        <VStack spacing={4} align="stretch">
                          <Text color={subtle} fontSize="sm">
                            Enter your number to receive an OTP. We show shop names and points only after verification.
                          </Text>
                          <InputGroup size="lg">
                            <InputLeftElement>
                              <Phone size={18} />
                            </InputLeftElement>
                            <Input
                              placeholder="Mobile number"
                              value={phoneQuery}
                              onChange={(e) => setPhoneQuery(e.target.value)}
                              type="tel"
                              bg={useColorModeValue('gray.50', 'whiteAlpha.100')}
                              borderColor={border}
                              borderRadius="xl"
                            />
                          </InputGroup>
                          <Button
                            w="full"
                            size="lg"
                            colorScheme="brand"
                            rightIcon={<ArrowRight size={18} />}
                            onClick={startOtp}
                            isLoading={loyaltyLoading}
                          >
                            Send OTP
                          </Button>
                        </VStack>
                      ) : loyaltyStep === 'otp' ? (
                        <VStack spacing={4} align="stretch">
                          <Text color={subtle} fontSize="sm">
                            Enter the 6-digit OTP sent to your phone.
                          </Text>
                          <InputGroup size="lg">
                            <InputLeftElement>
                              <Gift size={18} />
                            </InputLeftElement>
                            <Input
                              placeholder="6-digit OTP"
                              value={otp}
                              onChange={(e) => setOtp(e.target.value)}
                              inputMode="numeric"
                              maxLength={6}
                              bg={useColorModeValue('gray.50', 'whiteAlpha.100')}
                              borderColor={border}
                              borderRadius="xl"
                            />
                          </InputGroup>
                          <Button
                            w="full"
                            size="lg"
                            colorScheme="brand"
                            rightIcon={<ArrowRight size={18} />}
                            onClick={verifyOtp}
                            isLoading={loyaltyLoading}
                          >
                            Verify OTP
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setLoyaltyStep('phone');
                              setVerificationId('');
                              setOtp('');
                              setShops([]);
                            }}
                          >
                            Change number
                          </Button>
                        </VStack>
                      ) : (
                        <VStack spacing={5} align="stretch">
                          <Box
                            p={6}
                            borderRadius="2xl"
                            bg={useColorModeValue('gray.50', 'whiteAlpha.100')}
                            border="1px solid"
                            borderColor={border}
                          >
                            <Text fontSize="sm" color={subtle} fontWeight="700">
                              Your shops
                            </Text>
                            <Heading size="md" color={title} mt={1}>
                              {shops.length ? `${shops.length} shop(s) found` : 'No shops found'}
                            </Heading>
                            <Divider my={4} borderColor={border} />
                            {shops.length === 0 ? (
                              <Text color={subtle}>
                                No loyalty profiles are linked to this number.
                              </Text>
                            ) : (
                              <VStack spacing={3} align="stretch">
                                {shops.map((s) => (
                                  <Flex
                                    key={String(s.tenantId)}
                                    p={4}
                                    borderRadius="xl"
                                    bg={useColorModeValue('white', 'whiteAlpha.100')}
                                    border="1px solid"
                                    borderColor={border}
                                    align="center"
                                    justify="space-between"
                                    gap={3}
                                  >
                                    <Box>
                                      <Text fontWeight="900" color={title}>{s.shopDisplayName}</Text>
                                      <Text fontSize="sm" color={subtle}>
                                        {s.points} points · {s.tier} tier
                                      </Text>
                                    </Box>
                                    <Button size="sm" colorScheme="brand" onClick={() => navigate(`/portal/${s.tenantId}`)}>
                                      Open
                                    </Button>
                                  </Flex>
                                ))}
                              </VStack>
                            )}
                          </Box>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setLoyaltyStep('phone');
                              setVerificationId('');
                              setOtp('');
                              setShops([]);
                              setPhoneQuery('');
                            }}
                          >
                            Start over
                          </Button>
                        </VStack>
                      )}
                    </CardBody>
                  </Card>

                  <Card bg={surface} border="1px solid" borderColor={border} borderRadius="2xl" boxShadow="lg">
                    <CardBody p={{ base: 6, md: 7 }}>
                      <VStack align="stretch" spacing={4}>
                        <Heading size="md" color={title} letterSpacing="-0.02em">
                          How rewards work
                        </Heading>
                        <Text color={subtle}>
                          Earn points when you shop and redeem them during participating promotions. Terms may vary by store.
                        </Text>
                        <Divider borderColor={border} />
                        <VStack align="stretch" spacing={3}>
                          <HStack spacing={3}>
                            <Badge borderRadius="full" px={3} py={1} colorScheme="brand">
                              1
                            </Badge>
                            <Text fontWeight="700" color={title}>
                              Shop at the mall
                            </Text>
                          </HStack>
                          <HStack spacing={3}>
                            <Badge borderRadius="full" px={3} py={1} colorScheme="brand">
                              2
                            </Badge>
                            <Text fontWeight="700" color={title}>
                              Collect points automatically
                            </Text>
                          </HStack>
                          <HStack spacing={3}>
                            <Badge borderRadius="full" px={3} py={1} colorScheme="brand">
                              3
                            </Badge>
                            <Text fontWeight="700" color={title}>
                              Check and redeem during offers
                            </Text>
                          </HStack>
                        </VStack>
                        <Button variant="ghost" onClick={() => toast('Help/FAQ page can be added next.')}>
                          View FAQ
                        </Button>
                      </VStack>
                    </CardBody>
                  </Card>
                </SimpleGrid>
              </TabPanel>
            </TabPanels>
          )}
        </Tabs>
      </Container>

      {/* Footer (keep staff login out of the main customer UI) */}
      <Box borderTop="1px solid" borderColor={border} bg={useColorModeValue('rgba(255,255,255,0.55)', 'rgba(17,24,39,0.35)')}>
        <Container maxW="container.xl" py={6}>
          <Flex align="center" justify="space-between" gap={4} flexWrap="wrap">
            <Text fontSize="sm" color={subtle}>
              © {new Date().getFullYear()} SME 360
            </Text>
            <Button size="sm" variant="link" colorScheme="brand" onClick={() => navigate('/login')}>
              Staff login
            </Button>
          </Flex>
        </Container>
      </Box>
    </Box>
  );
}
