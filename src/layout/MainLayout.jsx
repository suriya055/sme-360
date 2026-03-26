import React, { useEffect, useState } from 'react';
import { Box, Flex, useColorModeValue, Text } from '@chakra-ui/react';
import Sidebar from '../components/Sidebar';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

export default function MainLayout() {
  const bg = useColorModeValue('gray.50', 'gray.900');
  const borderColor = useColorModeValue('gray.100', 'gray.700');

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar on route change (mobile) and prevent background scroll while open.
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [sidebarOpen]);

  return (
    <Box minH="100vh" bg={bg}>
      <Sidebar
        display={{ base: sidebarOpen ? 'flex' : 'none', md: 'flex' }}
        onClose={() => setSidebarOpen(false)}
        w={{ base: '280px', md: '280px' }}
      />

      {/* Mobile Header (Minimal) */}
      <Flex
        display={{ base: 'flex', md: 'none' }}
        position="fixed"
        top={0}
        left={0}
        right={0}
        sx={{
          paddingTop: 'env(safe-area-inset-top)',
          height: 'calc(3.5rem + env(safe-area-inset-top))',
        }}
        bg="white"
        _dark={{ bg: 'gray.800' }}
        backdropFilter="blur(12px)"
        borderBottom="1px"
        borderColor={borderColor}
        alignItems="center"
        px={4}
        zIndex={150}
        shadow="sm"
        gap={3}
      >
        <Box
          as="button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle Sidebar"
          display="flex"
          alignItems="center"
          justifyContent="center"
          lineHeight="0"
          color="brand.500"
          w="10"
          h="10"
          borderRadius="md"
          _hover={{ bg: 'brand.50' }}
          _active={{ bg: 'brand.100' }}
          transition="background 0.2s"
          flexShrink={0}
        >
          {sidebarOpen ? <X size={24} strokeWidth={2.5} /> : <Menu size={24} strokeWidth={2.5} />}
        </Box>

        <Text
          as="span"
          fontSize="xl"
          fontWeight="800"
          bgGradient="linear(to-r, brand.500, accent.500)"
          bgClip="text"
          letterSpacing="tight"
          lineHeight="normal"
          display="block"
        >
          SME 360
        </Text>

        <Box ml="auto" display="flex" alignItems="center">
        </Box>
      </Flex>

      <Box
        ml={{ base: 0, md: '280px' }}
        pt={{ base: 'calc(3.5rem + env(safe-area-inset-top) + 1.25rem)', md: 8 }}
        px={{ base: 4, md: 8 }}
        pb={{ base: 'calc(env(safe-area-inset-bottom) + 1rem)', md: 8 }}
        transition=".3s ease"
      >
        <Outlet />
      </Box>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="blackAlpha.600"
          backdropFilter="blur(4px)"
          zIndex={135}
          onClick={() => setSidebarOpen(false)}
          display={{ base: 'block', md: 'none' }}
        />
      )}
      {/* Desktop launcher stays floating; mobile launcher lives in the header. */}
    </Box>
  );
}
