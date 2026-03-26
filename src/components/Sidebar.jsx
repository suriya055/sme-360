import React from 'react';
import { Box, VStack, Icon, Text, Flex, useColorModeValue, Avatar, Badge, Spacer, Divider } from '@chakra-ui/react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, History, Users, Settings, LogOut, Receipt, Bell, ChevronRight, Shield, MessageSquare, Smartphone, Truck, FileText, Star, CheckCircle, Calendar, BarChart2 } from 'lucide-react';
import { useApp } from '../hooks/useApp';

const NavItem = ({ icon, label, to, badge, onClick }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  // Active State Styles
  const activeBg = useColorModeValue('brand.500', 'brand.600');
  const activeColor = 'white';
  const activeShadow = '0 4px 12px rgba(99, 102, 241, 0.3)';

  // Inactive State Styles
  const inactiveColor = useColorModeValue('gray.600', 'gray.400');
  const hoverBg = useColorModeValue('brand.50', 'gray.800');
  const hoverColor = useColorModeValue('brand.700', 'brand.300');

  return (
    <NavLink to={to} style={{ width: '100%' }} onClick={onClick}>
      <Flex
        align="center"
        p={3}
        mx={3}
        my={1}
        borderRadius="xl"
        cursor="pointer"
        bg={isActive ? activeBg : 'transparent'}
        color={isActive ? activeColor : inactiveColor}
        boxShadow={isActive ? activeShadow : 'none'}
        _hover={{
          bg: isActive ? activeBg : hoverBg,
          color: isActive ? activeColor : hoverColor,
          transform: 'translateX(4px)',
        }}
        transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        position="relative"
        role="group"
      >
        <Icon as={icon} mr={3} boxSize={5} strokeWidth={isActive ? 2.5 : 2} />
        <Text fontSize="sm" fontWeight={isActive ? '600' : '500'}>{label}</Text>

        {badge && (
          <Badge
            ml="auto"
            bg={isActive ? 'whiteAlpha.300' : 'red.500'}
            color={isActive ? 'white' : 'white'}
            borderRadius="full"
            fontSize="xs"
            px={2}
            boxShadow="sm"
          >
            {badge}
          </Badge>
        )}

        {isActive && (
          <Icon
            as={ChevronRight}
            ml="auto"
            boxSize={4}
            opacity={0.8}
            display={badge ? 'none' : 'block'}
          />
        )}
      </Flex>
    </NavLink>
  );
};

export default function Sidebar({ onClose, ...props }) {
  const { user, logout, sales, products, cart, hasPermission } = useApp();
  const navigate = useNavigate();

  const pendingSales = sales.filter(s => s.status === 'pending').length;
  const lowStockItems = products.filter(p => p.stock <= p.lowStockThreshold && p.stock > 0).length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const glassBg = useColorModeValue('rgba(255, 255, 255, 0.95)', 'rgba(26, 32, 44, 0.95)'); // Increased opacity for better readability on mobile
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const isCashier = user?.role === 'cashier';

  return (
    <Box
      w={{ base: '280px', md: '280px' }}
      h={{ base: 'calc(100vh - (3.5rem + env(safe-area-inset-top)))', md: '100vh' }}
      borderRight="1px"
      borderColor={borderColor}
      bg={glassBg}
      backdropFilter="blur(20px)"
      pos="fixed"
      left={0}
      top={{ base: 'calc(3.5rem + env(safe-area-inset-top))', md: 0 }}
      display={{ base: 'none', md: 'flex' }}
      flexDirection="column"
      zIndex={140}
      overflowY="auto"
      overflowX="hidden"
      boxShadow="2xl"
      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      pb="40px"
      {...props}
    >
      <Flex h="24" alignItems="center" px="8" justifyContent="center" display={{ base: 'none', md: 'flex' }}>
        <Flex
          align="center"
          justify="center"
          bgGradient="linear(to-br, brand.500, accent.500)"
          bgClip="text"
        >
          <Icon as={Package} boxSize={8} color="brand.500" mr={2} fill="currentColor" fillOpacity={0.1} />
          <Text fontSize="2xl" fontFamily="heading" fontWeight="extrabold" letterSpacing="tight">
            SME<Box as="span" color="gray.800">360</Box>
          </Text>
        </Flex>
      </Flex>

      {/* User Card */}
      <Box mx={4} mb={6} mt={{ base: 6, md: 0 }} p={4} borderRadius="2xl" bgGradient="linear(to-br, white, brand.50)" border="1px solid" borderColor="brand.100" boxShadow="sm">
        <Flex align="center" gap={3}>
          <Avatar
            size="sm"
            name={user?.name}
            src={user?.avatar}
            bgGradient="linear(to-r, brand.400, accent.400)"
            color="white"
            fontWeight="bold"
          />
          <Box overflow="hidden">
            <Text fontWeight="bold" fontSize="sm" isTruncated color="gray.800">{user?.name || 'Admin'}</Text>
            <Text fontSize="xs" color="brand.500" fontWeight="medium" textTransform="uppercase" letterSpacing="wide">{user?.role || 'Manager'}</Text>
          </Box>
        </Flex>
      </Box>

      <VStack spacing={1} align="stretch" px={1} flex={1} overflowY="auto" css={{ '&::-webkit-scrollbar': { width: '4px' } }}>
        <Text px={6} py={2} fontSize="xs" fontWeight="bold" color="gray.400" textTransform="uppercase" letterSpacing="wider">Menu</Text>

        {/* --- Operations --- */}
        {!isCashier && (
          <NavItem icon={LayoutDashboard} label="Dashboard" to="/" onClick={onClose} />
        )}
        <NavItem icon={ShoppingCart} label="Point of Sale" to="/pos" badge={cart?.length > 0 ? cart.length : null} onClick={onClose} />
        <NavItem icon={History} label="Transactions" to="/sales" badge={pendingSales > 0 ? pendingSales : null} onClick={onClose} />
        <NavItem icon={Receipt} label="Expenses" to="/expenses" onClick={onClose} />

        {!isCashier && (
          <>
            {/* --- Inventory & Supply --- */}
            <Box pt={4}>
              <Text px={6} py={2} fontSize="xs" fontWeight="bold" color="gray.400" textTransform="uppercase" letterSpacing="wider">Inventory & Logistics</Text>
              <NavItem icon={Package} label="Inventory" to="/inventory" badge={lowStockItems > 0 ? lowStockItems : null} onClick={onClose} />
              <NavItem icon={Truck} label="Suppliers" to="/suppliers" onClick={onClose} />
              <NavItem icon={FileText} label="Purchase Orders" to="/purchase-orders" onClick={onClose} />
              <NavItem icon={History} label="Accounts Payable" to="/accounts-payable" onClick={onClose} />
            </Box>

            {/* --- Customers & Growth --- */}
            <Box pt={4}>
              <Text px={6} py={2} fontSize="xs" fontWeight="bold" color="gray.400" textTransform="uppercase" letterSpacing="wider">Customer Engagement</Text>
              <NavItem icon={Users} label="Customers" to="/customers" onClick={onClose} />
              <NavItem icon={MessageSquare} label="Campaigns" to="/campaigns" onClick={onClose} />
              <NavItem icon={Star} label="Feedback" to="/feedback" onClick={onClose} />
              {hasPermission('canManageCustomers') && (
                <NavItem icon={MessageSquare} label="Queries" to="/admin/queries" onClick={onClose} />
              )}
            </Box>

            {/* --- Finance & HR --- */}
            <Box pt={4}>
              <Text px={6} py={2} fontSize="xs" fontWeight="bold" color="gray.400" textTransform="uppercase" letterSpacing="wider">Finance & Staff</Text>
              <NavItem icon={Users} label="Payroll" to="/payroll" onClick={onClose} />
              <NavItem icon={CheckCircle} label="Bank Reconciliation" to="/bank-reconciliation" onClick={onClose} />
              <NavItem icon={BarChart2} label="Reports" to="/reports" onClick={onClose} />
            </Box>

            {/* --- Administration --- */}
            <Box pt={4}>
              <Text px={6} py={2} fontSize="xs" fontWeight="bold" color="gray.400" textTransform="uppercase" letterSpacing="wider">System Setup</Text>
              <NavItem icon={Calendar} label="Events & Offers" to="/events" onClick={onClose} />
              {hasPermission('canManageUsers') && (
                <>
                  <NavItem icon={Shield} label="Users" to="/users" onClick={onClose} />
                  <NavItem icon={Smartphone} label="Bot Setup" to="/admin/bot-settings" onClick={onClose} />
                </>
              )}
              <NavItem icon={Settings} label="Settings" to="/settings" onClick={onClose} />
            </Box>
          </>
        )}
      </VStack>

      <Box width="full" px={4} py={4}>
        <Divider mb={4} />
        <VStack spacing={1} align="stretch">
          <Flex
            align="center"
            p={3}
            mx={3}
            borderRadius="xl"
            cursor="pointer"
            color="danger.500"
            _hover={{
              bg: 'danger.50',
              transform: 'translateX(4px)'
            }}
            transition="all 0.2s"
            onClick={handleLogout}
            role="group"
          >
            <Icon as={LogOut} mr={3} boxSize={5} transition="transform 0.2s" _groupHover={{ transform: 'rotate(180deg)' }} />
            <Text fontSize="sm" fontWeight="medium">Sign Out</Text>
          </Flex>
        </VStack>
        <Text fontSize="10px" textAlign="center" color="gray.300" mt={4}>v1.0.0 • SME 360</Text>
      </Box>
    </Box>
  );
}
