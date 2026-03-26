import React, { useState } from 'react';
import {
  Flex, Box, Heading, Text, Input, Button,
  FormControl, FormLabel, VStack, HStack,
  InputGroup, InputLeftElement, InputRightElement, useColorModeValue,
  Image, Badge, Icon, SimpleGrid, Tooltip, IconButton
} from '@chakra-ui/react';
import { Mail, Lock, Store, Eye, EyeOff, Shield, Users, DollarSign, Command } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../hooks/useApp';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useApp();
  const navigate = useNavigate();

  const [showLogin, setShowLogin] = useState(false);

  // Modern gradient for the split screen (and landing)
  const sideBg = useColorModeValue(
    'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)',
    'linear-gradient(135deg, #1e40af 0%, #0f172a 100%)'
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        toast.success('Welcome back! Login successful.');
        // Small delay for smooth transition feel
        setTimeout(() => navigate('/'), 800);
      } else {
        toast.error('Invalid credentials. Please check your email and password.');
      }
    } catch (error) {
      toast.error('Connection failed. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!showLogin) {
    return (
      <Flex h="100vh" align="center" justify="center" bg={sideBg} color="white" direction="column" p={4} position="relative" overflow="hidden">
        {/* Decorative Circles */}
        <Box position="absolute" top="-10%" left="-10%" w="500px" h="500px" bg="rgba(255,255,255,0.05)" borderRadius="full" />
        <Box position="absolute" bottom="-10%" right="-10%" w="400px" h="400px" bg="rgba(255,255,255,0.05)" borderRadius="full" />

        <VStack spacing={6} maxW="900px" textAlign="center" zIndex={1} w="full">
          <Box p={3} bg="white" borderRadius="2xl" shadow="2xl" mb={2}>
            <Store size={48} color="#0ea5e9" />
          </Box>

          <Heading
            size={{ base: '2xl', md: '3xl' }}
            fontWeight="extrabold"
            letterSpacing="tight"
          >
            SME 360
          </Heading>

          <Text fontSize={{ base: 'md', md: 'xl' }} opacity={0.9} maxW="600px">
            Manage your business with confidence. The next generation platform for Sales, Inventory, and Customer Management.
          </Text>


          <Button
            size="lg"
            colorScheme="whiteAlpha"
            bg="white"
            color="brand.600"
            px={8}
            py={6}
            fontSize="lg"
            fontWeight="bold"
            rightIcon={<Icon as={Users} />}
            onClick={() => setShowLogin(true)}
            mt={8}
            _hover={{ transform: 'scale(1.05)', shadow: 'xl' }}
            transition="all 0.2s"
          >
            Get Started
          </Button>
        </VStack>

        <Box position="absolute" bottom={4} opacity={0.6}>
          <Text fontSize="sm">© 2026 SME 360. All rights reserved.</Text>
        </Box>
      </Flex>
    );
  }

  return (
    <Flex minH="100vh" align="center" justify="center" bg={sideBg} p={4} position="relative" overflow="hidden">

      {/* Decorative Circles (Subtler for Login View) */}
      <Box position="absolute" top="-20%" left="-10%" w="600px" h="600px" bg="rgba(255,255,255,0.03)" borderRadius="full" />
      <Box position="absolute" bottom="-20%" right="-10%" w="500px" h="500px" bg="rgba(255,255,255,0.03)" borderRadius="full" />

      {/* Back Button */}
      <IconButton
        icon={<Icon as={Shield} transform="rotate(180deg)" />}
        variant="ghost"
        color="white"
        position="absolute"
        top={6}
        left={6}
        onClick={() => setShowLogin(false)}
        aria-label="Back"
        size="md"
        zIndex={10}
        _hover={{ bg: 'whiteAlpha.200', transform: 'translateX(-2px)' }}
      >
        Back
      </IconButton>

      <Box
        w="full"
        maxW="450px"
        bg="white"
        borderRadius="2xl"
        shadow="2xl"
        p={{ base: 6, md: 10 }}
        zIndex={2}
        animation="fadeIn 0.5s ease-out"
      >
        <VStack spacing={8} align="stretch">

          <Box textAlign="center" mb={2}>
            <Flex justify="center" mb={4}>
              <Box p={3} bg="brand.50" borderRadius="xl">
                <Store size={32} color="#0ea5e9" />
              </Box>
            </Flex>
            <Heading size="xl" mb={2} color="brand.600">Welcome Back</Heading>
            <Text color="gray.500">Sign in to continue to SME 360</Text>
          </Box>

          <form onSubmit={handleSubmit}>
            <VStack spacing={5}>
              <FormControl isRequired>
                <FormLabel fontWeight="medium">Email Address</FormLabel>
                <InputGroup size="lg">
                  <InputLeftElement>
                    <Mail color="#a0aec0" size={20} />
                  </InputLeftElement>
                  <Input
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    borderRadius="xl"
                    borderColor="gray.200"
                    _hover={{ borderColor: 'brand.400' }}
                    _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                  />
                </InputGroup>
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontWeight="medium">Password</FormLabel>
                <InputGroup size="lg">
                  <InputLeftElement>
                    <Lock color="#a0aec0" size={20} />
                  </InputLeftElement>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    borderRadius="xl"
                    borderColor="gray.200"
                    _hover={{ borderColor: 'brand.400' }}
                    _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                  />
                  <InputRightElement onClick={() => setShowPassword(!showPassword)} cursor="pointer">
                    {showPassword ? <EyeOff color="#a0aec0" size={20} /> : <Eye color="#a0aec0" size={20} />}
                  </InputRightElement>
                </InputGroup>
                <Flex justify="flex-end" mt={1}>
                  <Button variant="link" size="xs" color="brand.500" fontWeight="medium">
                    Forgot Password?
                  </Button>
                </Flex>
              </FormControl>

              <Button
                type="submit"
                colorScheme="brand"
                size="lg"
                w="full"
                borderRadius="xl"
                isLoading={isLoading}
                loadingText="Verifying..."
                fontSize="md"
                shadow="lg"
                _hover={{ transform: 'translateY(-2px)', shadow: 'xl' }}
                transition="all 0.2s"
              >
                Sign In
              </Button>
            </VStack>
          </form>

        </VStack>
      </Box>
    </Flex>
  );
}
