import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import BarcodeScanner from '../components/pos/BarcodeScanner'; // [FEATURE #5]
import {
  Box, Grid, Input, InputGroup, InputLeftElement, InputRightElement,
  Card, CardBody, Image, Text, Badge, Button,
  VStack, HStack, Heading, Divider, IconButton,
  Flex, useColorModeValue, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalBody, ModalFooter, useDisclosure, FormControl, FormLabel,
  Select, NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper,
  Tabs, TabList, TabPanels, Tab, TabPanel,
  Alert, AlertIcon, AlertTitle, AlertDescription,
  Drawer, DrawerBody, DrawerHeader, DrawerOverlay, DrawerContent, DrawerCloseButton,
  Tag, TagLabel, TagLeftIcon,
  Textarea, Slider, SliderTrack, SliderFilledTrack, SliderThumb,
  Progress,
  Tooltip, Popover, PopoverTrigger, PopoverContent, PopoverHeader, PopoverBody, PopoverArrow, PopoverCloseButton,
  SimpleGrid, Code,
  Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon,
  Menu, MenuButton, MenuList, MenuItem,
  CloseButton,
  InputRightAddon,
  AbsoluteCenter,
  Center,
  Spinner,
  ScaleFade,
  SlideFade,
  useToken,
  useBreakpointValue,
  Avatar
} from '@chakra-ui/react';
import {
  Search, Plus, Minus, Trash2, CreditCard, Clock, ShoppingCart, User,
  Barcode, Filter, Tag as TagIcon, Percent, Zap,
  Package, Calculator, Wallet, Smartphone, Check, ShoppingBag,
  Printer, Settings, Scan, Hash,
  DollarSign, AlertCircle, HelpCircle, Rocket,
  Volume2, VolumeX, Maximize2, Minimize2, CheckCircle,
  FastForward, Play, Power, TrendingUp, Gift, ChevronRight,
  Star, Award, Crown, Trophy, Sparkles, Coins,
  X, Grid as GridIcon, List as ListIcon, MoreHorizontal,
  RotateCcw, MoreVertical, LayoutGrid, List
} from 'lucide-react';
import { useApp } from '../hooks/useApp';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import ImageWithFallback from '../components/common/ImageWithFallback';

// --- Components ---

// Keyboard shortcuts handler (Refined)
const useKeyboardShortcuts = () => {
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.key) {
        case 'F2':
          e.preventDefault();
          toast('New Sale Started', { icon: '🆕' });
          break;
        case 'F3':
          e.preventDefault();
          document.getElementById('search-input')?.focus();
          break;
        case 'F4':
          e.preventDefault();
          const quickBuyBtn = document.getElementById('quick-buy-btn');
          if (quickBuyBtn && !quickBuyBtn.disabled) quickBuyBtn.click();
          break;
        case 'F9':
          e.preventDefault();
          const holdBtn = document.getElementById('hold-order-btn');
          if (holdBtn && !holdBtn.disabled) holdBtn.click();
          break;
        case 'Escape':
          e.preventDefault();
          document.getElementById('search-input')?.blur();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);
};

// Premium Category Filter
// Premium Category Filter with Slide Bar
const CategoryFilter = ({ categories, selectedCategory, onSelectCategory }) => {
  return (
    <Box position="relative" w="full" mb={4}>
      <Flex
        overflowX="auto"
        pb={3}
        css={{
          '&::-webkit-scrollbar': {
            height: '6px',
            display: 'block'
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(0,0,0,0.02)',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#CBD5E0',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: '#A0AEC0',
          },
        }}
      >
        <HStack spacing={3} px={1} minW="max-content">
          {categories.map(cat => (
            <Button
              key={cat}
              size="sm"
              variant={selectedCategory === cat ? 'solid' : 'outline'}
              colorScheme="brand"
              bg={selectedCategory === cat ? 'brand.500' : 'white'}
              backdropFilter="blur(8px)"
              onClick={() => onSelectCategory(cat)}
              borderRadius="full"
              px={6}
              leftIcon={cat === 'all' ? <GridIcon size={14} /> : <TagIcon size={14} />}
              _hover={{ transform: 'translateY(-2px)', shadow: 'md', bg: selectedCategory === cat ? 'brand.600' : 'gray.50' }}
              transition="all 0.2s"
              fontWeight="600"
              boxShadow={selectedCategory === cat ? 'md' : 'sm'}
              borderColor={selectedCategory === cat ? 'transparent' : 'gray.200'}
            >
              {cat === 'all' ? 'All Products' : cat}
            </Button>
          ))}
        </HStack>
      </Flex>
    </Box>
  );
};

// Premium Cart Header
const CartHeader = ({ cart, finalTotal, onClearCart, selectedCustomerId, customers, onRemoveCustomer, onSelectCustomer }) => {
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Box p={4} bg="white" borderBottom="1px solid" borderColor="gray.100">
      <Flex justify="space-between" align="center" mb={4}>
        <Flex align="center" gap={2}>
          <Box p={2} bg="brand.50" borderRadius="lg">
            <ShoppingCart size={20} color="#4f46e5" />
          </Box>
          <Box>
            <Heading size="sm" color="gray.800">Current Sale</Heading>
            <Text fontSize="xs" color="gray.500" fontWeight="500">Order #{Math.floor(Math.random() * 10000)}</Text>
          </Box>
        </Flex>

        <HStack>
          <Badge colorScheme="brand" variant="subtle" px={2} py={1} borderRadius="md" fontSize="xs">
            {cartItemCount} Items
          </Badge>
          <Tooltip label="Clear Cart">
            <IconButton
              icon={<Trash2 size={16} />}
              size="sm"
              variant="ghost"
              colorScheme="red"
              onClick={onClearCart}
              isDisabled={cart.length === 0}
              aria-label="Clear cart"
              borderRadius="full"
              _hover={{ bg: 'red.50' }}
            />
          </Tooltip>
        </HStack>
      </Flex>

      {/* Customer Selector */}
      <Box mt={2}>
        {selectedCustomerId ? (
          <Flex
            align="center"
            justify="space-between"
            p={2}
            bg="gray.50"
            borderRadius="lg"
            border="1px solid"
            borderColor="gray.200"
          >
            <Flex align="center" gap={3}>
              <Avatar
                size="xs"
                name={customers.find(c => (c._id === selectedCustomerId || c.id === selectedCustomerId))?.name}
                bg="brand.100"
                color="brand.600"
              />
              <Box>
                <Text fontSize="sm" fontWeight="600" color="gray.800">
                  {customers.find(c => (c._id === selectedCustomerId || c.id === selectedCustomerId))?.name}
                </Text>
              </Box>
            </Flex>
            <IconButton
              icon={<X size={14} />}
              size="xs"
              variant="ghost"
              color="gray.500"
              onClick={onRemoveCustomer}
              borderRadius="full"
              _hover={{ bg: 'gray.200', color: 'red.500' }}
            />
          </Flex>
        ) : (
          <Button
            w="full"
            variant="outline"
            color="gray.600"
            leftIcon={<UserPlusIcon size={16} />}
            onClick={onSelectCustomer}
            size="sm"
            fontWeight="500"
            borderStyle="dashed"
            _hover={{ bg: 'gray.50', borderColor: 'brand.300', color: 'brand.600' }}
          >
            Add Customer
          </Button>
        )}
      </Box>
    </Box>
  );
};

const UserPlusIcon = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <line x1="20" y1="8" x2="20" y2="14" />
    <line x1="23" y1="11" x2="17" y2="11" />
  </svg>
);

// Premium Cart Item
const CartItem = ({ item, onUpdateQuantity, onRemove }) => {
  const subtotal = item.price * item.quantity;
  const discountAmount = subtotal * ((item.discount || 0) / 100);
  const discountedTotal = subtotal - discountAmount;

  return (
    <Box
      p={3}
      bg="white"
      borderBottom="1px solid"
      borderColor="gray.50"
      _last={{ borderBottom: 'none' }}
      transition="all 0.2s"
      _hover={{ bg: 'gray.50' }}
      position="relative"
    >
      <Flex gap={3} align="center">
        {/* Quantity Controls - Vertical for space efficiency */}
        <VStack spacing={1} borderRadius="lg" bg="gray.100" p={1}>
          <IconButton
            icon={<Plus size={10} />}
            size="xs"
            variant="ghost"
            h="18px"
            w="18px"
            minW="18px"
            borderRadius="md"
            onClick={() => onUpdateQuantity((item._id || item.id), 1)}
            aria-label="Increase quantity"
            _hover={{ bg: 'white', color: 'green.500' }}
          />
          <Text fontSize="xs" fontWeight="700" color="gray.700">{item.quantity}</Text>
          <IconButton
            icon={<Minus size={10} />}
            size="xs"
            variant="ghost"
            h="18px"
            w="18px"
            minW="18px"
            borderRadius="md"
            onClick={() => onUpdateQuantity((item._id || item.id), -1)}
            isDisabled={item.quantity <= 1}
            aria-label="Decrease quantity"
            _hover={{ bg: 'white', color: 'red.500' }}
          />
        </VStack>

        {/* Product Info */}
        <Box flex={1}>
          <Text fontSize="sm" fontWeight="600" noOfLines={1} color="gray.800" title={item.name}>
            {item.name}
          </Text>
          <Flex justify="space-between" align="center" mt={1}>
            <Text fontSize="xs" color="gray.500">
              {item.quantity} x ₹{item.price}
            </Text>
            {item.discount > 0 && (
              <Badge colorScheme="green" fontSize="2xs" variant="subtle">-{item.discount}%</Badge>
            )}
          </Flex>
        </Box>

        {/* Price & Remove */}
        <Box textAlign="right">
          <Text fontSize="sm" fontWeight="700" color="brand.600">
            ₹{discountedTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </Text>
          <IconButton
            icon={<Trash2 size={12} />}
            size="xs"
            variant="ghost"
            color="gray.400"
            h="20px"
            w="20px"
            minW="20px"
            mt={1}
            onClick={() => onRemove((item._id || item.id))}
            _hover={{ color: 'red.500', bg: 'red.50' }}
            aria-label="Remove item"
          />
        </Box>
      </Flex>
    </Box>
  );
};

// Premium Product Card
const ProductCard = ({ product, onAdd, onQuickBuy, isActive }) => {
  const isLowStock = (product.stock || 0) <= (product.lowStockThreshold || 0) && (product.stock || 0) > 0;
  const isOutOfStock = (product.stock || 0) === 0;
  const [isHovered, setIsHovered] = useState(false);
  const [imgError, setImgError] = useState(false);

  return (
    <ScaleFade in={true} initialScale={0.95}>
      <Card
        h="100%"
        cursor={isOutOfStock ? "not-allowed" : "pointer"}
        onClick={() => !isOutOfStock && onAdd(product)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        variant="elevated"
        bg="white"
        borderRadius="2xl"
        overflow="hidden"
        transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        _hover={{
          transform: isOutOfStock ? 'none' : 'translateY(-6px)',
          shadow: 'xl',
        }}
        borderColor={isActive ? 'brand.500' : 'transparent'}
        borderWidth={isActive ? '2px' : '0px'}
        role="group"
      >
        <Box position="relative" h={{ base: "110px", md: "150px" }} overflow="hidden">
          <ImageWithFallback
            src={product.image}
            alt={product.name}
            w="100%"
            h="100%"
            transition="transform 0.5s"
            _groupHover={{ transform: !isOutOfStock ? 'scale(1.1)' : 'none' }}
            filter={isOutOfStock ? 'grayscale(100%)' : 'none'}
          />

          {/* Overlays */}
          <Box
            position="absolute"
            inset={0}
            bgGradient="linear(to-t, blackAlpha.700, transparent)"
            opacity={0.6}
          />

          {/* Stock Status */}
          <Badge
            position="absolute"
            top={3}
            right={3}
            colorScheme={isOutOfStock ? 'red' : isLowStock ? 'orange' : 'green'}
            variant="solid"
            borderRadius="full"
            backdropFilter="blur(4px)"
            boxShadow="md"
          >
            {isOutOfStock ? 'Out of Stock' : `${product.stock} Left`}
          </Badge>

          {/* Quick Buy Overlay Button */}
          {!isOutOfStock && (
            <Flex
              position="absolute"
              inset={0}
              align="center"
              justify="center"
              opacity={isHovered ? 1 : 0}
              transition="opacity 0.2s"
              bg="blackAlpha.300"
              backdropFilter="blur(2px)"
            >
              <Button
                leftIcon={<FastForward size={16} />}
                colorScheme="whiteAlpha"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickBuy(product);
                }}
                borderRadius="full"
                backdropFilter="blur(10px)"
                _hover={{ bg: 'white', color: 'brand.600' }}
              >
                Quick Buy
              </Button>
            </Flex>
          )}

          <Box position="absolute" bottom={3} left={3}>
            <Text color="white" fontWeight="bold" fontSize="lg" textShadow="0 2px 4px rgba(0,0,0,0.4)">
              ₹{(product.price || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </Text>
          </Box>
        </Box>

        <CardBody p={{ base: 2, md: 4 }}>
          <Text fontWeight="700" noOfLines={1} mb={1} fontSize={{ base: "sm", md: "md" }} color="gray.800">
            {product.name}
          </Text>
          <Flex justify="space-between" align="center" gap={2}>
            <Text fontSize="xs" color="gray.500" fontWeight="500" noOfLines={1} minW={0}>
              {product.category}
            </Text>
            {!!product.sku && (
              <Text
                fontSize="xs"
                color="gray.400"
                fontFamily="mono"
                whiteSpace="nowrap"
                flexShrink={0}
                textAlign="right"
                title={`SKU: ${product.sku}`}
              >
                <Box as="span" display={{ base: 'none', md: 'inline' }}>SKU: </Box>
                {product.sku}
              </Text>
            )}
          </Flex>
        </CardBody>
      </Card>
    </ScaleFade>
  );
};

// --- Main POS Component ---
export default function POS() {
  const {
    products,
    cart,
    customers,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    processSale,
    clearCart,
    settings,
    hasPermission
  } = useApp();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(settings?.gstRate || 18);
  const [tip, setTip] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cashReceived, setCashReceived] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [saleNotes, setSaleNotes] = useState('');
  const [lastCompletedSale, setLastCompletedSale] = useState(null);
  // [FEATURE #4] Split payment amounts
  const [splitCash, setSplitCash] = useState('');
  const [splitUPI, setSplitUPI] = useState('');
  const [upiRef, setUpiRef] = useState('');
  // [FEATURE #13] Loyalty points redeemed
  const [pointsRedeemed, setPointsRedeemed] = useState(0);

  const searchInputRef = useRef(null);
  useKeyboardShortcuts();

  // Dialog Controls
  const { isOpen: isCheckoutOpen, onOpen: onCheckoutOpen, onClose: chakraOnCheckoutClose } = useDisclosure();
  const handleCheckoutClose = () => {
    chakraOnCheckoutClose();
    setLastCompletedSale(null);
    setTimeout(() => {
      navigate('/pos');
    }, 100); // Delay navigation to allow modal to close
  };
  const { isOpen: isCustomerModalOpen, onOpen: onCustomerModalOpen, onClose: onCustomerModalClose } = useDisclosure();
  const { isOpen: isScannerOpen, onOpen: onScannerOpen, onClose: onScannerClose } = useDisclosure();
  const { isOpen: isQuickBuyOpen, onOpen: onQuickBuyOpen, onClose: onQuickBuyClose } = useDisclosure();

  const bg = useColorModeValue('gray.50', 'gray.900');
  const upiEnabled = settings?.paymentMethods?.upi ?? true;

  // --- Calculations ---
  // Get unique categories
  const categories = ['all', ...new Set(products.map(p => p.category))];

  const filteredProducts = products.filter(p => {
    const lowerSearch = searchTerm.toLowerCase();
    const name = p.name?.toLowerCase() || '';
    const sku = p.sku?.toLowerCase() || '';
    const matchesSearch = name.includes(lowerSearch) || sku.includes(lowerSearch);
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const cartSubtotal = cart.reduce((acc, item) => {
    const itemTotal = item.price * item.quantity;
    const itemDiscount = (itemTotal * (item.discount || 0)) / 100;
    return acc + itemTotal - itemDiscount;
  }, 0);

  const cartDiscountAmount = cartSubtotal * (discount / 100);
  const taxableAmount = cartSubtotal - cartDiscountAmount;
  const taxAmount = taxableAmount * (tax / 100);
  const tipAmount = taxableAmount * (tip / 100);

  // [FEATURE #13] Loyalty point deduction (1 point = ₹1)
  const finalTotalBeforePoints = taxableAmount + taxAmount + tipAmount;
  const finalTotal = Math.max(0, finalTotalBeforePoints - pointsRedeemed);

  const formatPaymentMethodLabel = (method) => {
    const v = (method || 'cash').toString().toLowerCase();
    if (v === 'upi') return 'UPI';
    if (v === 'cash') return 'Cash';
    return v.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
  };

  // Browser auto-print requires allowing popups; for true silent printing use Chrome kiosk printing.
  const printSaleReceipt = (sale) => {
    try {
      if (!sale) return false;

      const currency = settings?.currency || '₹';
      const storeName = settings?.storeName || 'SME 360';
      const address = settings?.address || '';
      const contact = settings?.contactNumber || '';
      const header = settings?.receiptHeader || '';
      const footer = settings?.receiptFooter || '';
      const gst = settings?.receiptTaxNumber || '';

      const saleId = (sale._id || sale.id || '').toString();
      const orderNo = sale.invoiceNumber || (saleId ? saleId.slice(-8) : 'N/A');
      const dateStr = (() => {
        try { return new Date(sale.date || Date.now()).toLocaleString('en-IN'); } catch { return ''; }
      })();

      const items = Array.isArray(sale.items) ? sale.items : [];
      const subtotal = Number(
        sale.subtotal ?? items.reduce((sum, i) => sum + (Number(i.price || 0) * Number(i.quantity || 0)), 0)
      );
      const discountAmount = Number(sale.discountAmount || 0);
      const tax = Number(sale.taxAmount || 0);
      const total = Number(sale.total ?? sale.totalAmount ?? (subtotal - discountAmount + tax) ?? 0);
      const paymentLabel = formatPaymentMethodLabel(sale.paymentMethod);

      const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      }[c]));

      const receiptHTML = `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Receipt</title>
    <style>
      :root { --w: 300px; }
      body { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; padding: 12px; max-width: var(--w); margin: 0 auto; }
      h2 { margin: 0; font-size: 16px; }
      .center { text-align: center; }
      .muted { color: #555; font-size: 11px; }
      hr { border: 0; border-top: 1px dashed #999; margin: 10px 0; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      td { padding: 2px 0; vertical-align: top; }
      td.qty { width: 42px; text-align: right; }
      td.amt { width: 90px; text-align: right; }
      .totals td { padding-top: 4px; }
      .bold { font-weight: 800; }
      @media print { body { padding: 0; } }
    </style>
  </head>
  <body>
    <div class="center">
      <h2>${esc(storeName)}</h2>
      ${header ? `<div class="muted">${esc(header)}</div>` : ''}
      ${address ? `<div class="muted">${esc(address)}</div>` : ''}
      ${contact ? `<div class="muted">${esc(contact)}</div>` : ''}
      ${gst ? `<div class="muted">${esc(gst)}</div>` : ''}
    </div>
    <hr />
    <div class="muted">Order: <span class="bold">${esc(orderNo)}</span></div>
    <div class="muted">Date: ${esc(dateStr)}</div>
    <div class="muted">Customer: ${esc(sale.customerName || 'Walk-in Customer')}</div>
    <div class="muted">Payment: ${esc(paymentLabel)}</div>
    <hr />
    <table>
      <tbody>
        ${items.map((i) => {
          const name = i.productName || i.name || (i.productId?.name) || 'Item';
          const qty = Number(i.quantity || 0);
          const price = Number(i.price || 0);
          const amt = qty * price;
          return `<tr><td>${esc(name)}</td><td class="qty">${esc(qty)}</td><td class="amt">${esc(currency)}${esc(amt.toFixed(2))}</td></tr>`;
        }).join('')}
      </tbody>
    </table>
    <hr />
    <table class="totals">
      <tbody>
        <tr><td>Subtotal</td><td class="amt">${esc(currency)}${esc(subtotal.toFixed(2))}</td></tr>
        ${discountAmount > 0 ? `<tr><td>Discount</td><td class="amt">-${esc(currency)}${esc(discountAmount.toFixed(2))}</td></tr>` : ''}
        ${tax > 0 ? `<tr><td>Tax</td><td class="amt">${esc(currency)}${esc(tax.toFixed(2))}</td></tr>` : ''}
        <tr><td class="bold">TOTAL</td><td class="amt bold">${esc(currency)}${esc(total.toFixed(2))}</td></tr>
      </tbody>
    </table>
    ${footer ? `<hr /><div class="center muted">${esc(footer).replace(/\n/g, '<br/>')}</div>` : ''}
  </body>
</html>`;

      const printFrame = document.createElement('iframe');
      printFrame.style.position = 'fixed';
      printFrame.style.right = '0';
      printFrame.style.bottom = '0';
      printFrame.style.width = '0';
      printFrame.style.height = '0';
      printFrame.style.border = '0';
      printFrame.style.visibility = 'hidden';
      document.body.appendChild(printFrame);

      const frameDoc = printFrame.contentWindow?.document || printFrame.contentDocument;
      if (!frameDoc) {
        document.body.removeChild(printFrame);
        return false;
      }

      frameDoc.open();
      frameDoc.write(receiptHTML);
      frameDoc.close();

      const doPrint = () => {
        try {
          printFrame.contentWindow?.focus();
          printFrame.contentWindow?.print();
        } catch (e) {
          console.error('[AutoPrint]', e);
        }
        setTimeout(() => {
          if (printFrame.parentNode) {
            printFrame.parentNode.removeChild(printFrame);
          }
        }, 1500);
      };

      if (printFrame.contentWindow) {
        printFrame.onload = doPrint;
        setTimeout(doPrint, 500);
      } else {
        doPrint();
      }

      return true;
    } catch (e) {
      console.error('[AutoPrint]', e);
      return false;
    }
  };

  // [FEATURE] Fallback download receipt when printer not available
  const downloadSaleReceipt = async (sale) => {
    try {
      if (!sale || !(sale._id || sale.id)) {
        throw new Error('Sale record missing');
      }
      const api = (await import('../services/api')).default;
      const id = sale._id || sale.id;
      const response = await api.get(`/sales/${id}/receipt`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const fileName = `receipt_${sale.invoiceNumber || (sale._id || sale.id).toString().slice(-8) || 'unknown'}.pdf`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Receipt downloaded as PDF. You can print it later.');
      return true;
    } catch (err) {
      console.error('[DownloadReceipt]', err);
      toast.error('Unable to download receipt. Please try again.');
      return false;
    }
  };

  // --- Handlers ---
  const handleAddToCart = (product) => {
    const productWithDiscount = { ...product, discount: discount > 0 ? discount : 0 };
    addToCart(productWithDiscount);
  };

  const handleProductQuickBuy = (product) => {
    clearCart();
    addToCart({ ...product, discount: discount > 0 ? discount : 0 });
    onQuickBuyOpen();
  };

  const handleCartQuickBuy = () => {
    if (cart.length === 0) return toast.error('Cart is empty');
    if (settings?.posSettings?.requireCustomerForSale && !selectedCustomerId) {
      return toast.error('Please select a customer');
    }
    onQuickBuyOpen();
  };

  const handleBarcodeSubmit = (e) => {
    if (e.key === 'Enter' && barcodeInput.trim()) {
      const product = products.find(p => p.sku === barcodeInput.trim().toUpperCase());
      if (product) {
        handleAddToCart(product);
        toast.success(`Added ${product.name}`);
      } else {
        toast.error('Product not found');
      }
      setBarcodeInput('');
    }
  };

  const applyCartDiscount = (percent) => {
    setDiscount(percent);
    cart.forEach(item => {
      // Logic to update all items discount if needed, or just keep global
      // Here we set global discount state which affects calculations
    });
    toast.success(`${percent}% Discount Applied`);
  };

  const handleClearCart = () => {
    if (cart.length === 0) return;
    if (window.confirm("Are you sure you want to clear the entire cart?")) {
      clearCart();
    }
  };

  // Checkout Logic
  const handleCheckout = async () => {
    if (cart.length === 0) return toast.error('Cart Empty');

    setIsProcessing(true);
    try {
      const customer = customers.find(c => (c._id === selectedCustomerId || c.id === selectedCustomerId));

      let method = (paymentMethod || 'cash').toLowerCase();
      if (method === 'upi' && !upiEnabled) {
        setIsProcessing(false);
        setPaymentMethod('cash');
        return toast.error('UPI is disabled in Settings.');
      }
      if (method === 'cash') {
        const received = cashReceived === '' ? finalTotal : parseFloat(cashReceived);
        if (Number.isNaN(received) || received < finalTotal) {
          setIsProcessing(false);
          return toast.error('Cash received must be equal to or greater than the total.');
        }
        // Keep the input consistent for UI change calculation
        setCashReceived(String(received));
      }

      const saleData = {
        status: 'completed',
        customerId: selectedCustomerId || null,
        customerName: customer?.name || 'Walk-in Customer',
        paymentMethod: method,
        subtotal: cartSubtotal,
        discountAmount: cartDiscountAmount,
        taxAmount,
        tipAmount,
        total: finalTotal,
        pointsRedeemed, // [FEATURE #13] Send deducted points to backend
        notes: method === 'upi' && upiRef?.trim()
          ? `${saleNotes ? saleNotes + ' | ' : ''}UPI Ref: ${upiRef.trim()}`
          : saleNotes
      };

      const finalizeSale = async () => {
        const createdSale = await processSale(saleData);
        setLastCompletedSale(createdSale);
        if (settings?.posSettings?.autoPrintReceipt) {
          const ok = printSaleReceipt(createdSale);
          if (!ok) {
            toast.warning('Auto print was blocked. Falling back to PDF download.');
            await downloadSaleReceipt(createdSale);
          }
        } else {
          toast.info('Receipt generated. You can download it from Sales screen or enable Auto Print in POS settings.');
        }
        // Success
        toast.success(`Sale Completed: ₹${finalTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`);
        setDiscount(0);
        setTip(0);
        setCashReceived('');
        setUpiRef('');
        setSaleNotes('');
        setSelectedCustomerId('');
        setPointsRedeemed(0); // [FEATURE #13] Reset points
        handleCheckoutClose();
        setIsProcessing(false);
      };

      await finalizeSale();
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.message || 'Checkout Failed');
      setIsProcessing(false);
    }
  };

  // Save as Pending Order
  const handleSaveAsPending = async () => {
    if (cart.length === 0) return toast.error('Cart Empty');

    setIsProcessing(true);
    try {
      const customer = customers.find(c => (c._id === selectedCustomerId || c.id === selectedCustomerId));

      const saleData = {
        status: 'pending',
        customerId: selectedCustomerId || null,
        customerName: customer?.name || 'Walk-in Customer',
        paymentMethod: paymentMethod || 'pending',
        subtotal: cartSubtotal,
        discountAmount: cartDiscountAmount,
        taxAmount,
        tipAmount,
        total: finalTotal,
        pointsRedeemed, // [FEATURE #13] Send deducted points to backend
        notes: saleNotes || 'Pending payment'
      };

      await processSale(saleData);

      // Success
      toast.success(`Order Saved as Pending: ₹${finalTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`);
      setDiscount(0);
      setTip(0);
      setCashReceived('');
      setSaleNotes('');
      setSelectedCustomerId('');
      setPointsRedeemed(0); // [FEATURE #13] Reset points
      handleCheckoutClose();
    } catch (e) {
      console.error(e);
      toast.error('Failed to save pending order');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuickBuyConfirm = async (method, cash) => {
    // Similar logic to handleCheckout but optimized for quick buy
    setPaymentMethod(method);
    setCashReceived(method === 'cash' ? cash : '');
    await handleCheckout(); // Reuse logic or separate if needed
    onQuickBuyClose();
  };


  // Mobile Cart Drawer State
  const { isOpen: isCartOpen, onOpen: onCartOpen, onClose: onCartClose } = useDisclosure();
  const isMobile = useBreakpointValue({ base: true, lg: false });

  // Mobile Bottom Bar Component
  const MobileBottomBar = () => (
    <Box
      id="pos-mobile-bottom-bar"
      position="fixed"
      bottom="0"
      left="0"
      right="0"
      bg="white"
      p={3}
      borderTop="1px solid"
      borderColor="gray.200"
      zIndex={20}
      display={{ base: 'block', lg: 'none' }}
      boxShadow="0 -4px 6px -1px rgba(0, 0, 0, 0.1)"
    >
      <Flex justify="space-between" align="center">
        <HStack>
          <Box p={2} bg="brand.100" borderRadius="full">
            <ShoppingBag size={20} color="#2563eb" />
          </Box>
          <Box>
            <Text fontSize="xs" color="gray.500">{cart.reduce((a, b) => a + b.quantity, 0)} Items</Text>
            <Text fontWeight="bold" fontSize="lg">₹{finalTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
          </Box>
        </HStack>
        <Button
          colorScheme="brand"
          onClick={onCartOpen}
          rightIcon={<ChevronRight />}
          size="md"
          borderRadius="full"
          px={6}
          bgGradient="linear(to-r, brand.500, brand.600)"
        >
          View Cart
        </Button>
      </Flex>
    </Box>
  );

  return (
    <Box h={{ base: "auto", lg: "calc(100vh - 80px)" }} bg={bg} overflow={{ base: "auto", lg: "hidden" }} display="flex" flexDirection={{ base: "column", lg: "row" }} pb={{ base: "80px", lg: 0 }}>
      {/* LEFT SECTION - PRODUCTS */}
      <Box flex="1" p={{ base: 2, md: 4 }} display="flex" flexDirection="column" gap={4} minW="0" h="100%">

        {/* Checkout completed reminder */}
        {lastCompletedSale && (
          <SlideFade in={true} offsetY="-20px">
            <Alert status="success" borderRadius="xl" mb={4} alignItems="center">
              <AlertIcon />
              <Box flex="1">
                <Text fontWeight="bold">Sale Completed!</Text>
                <Text fontSize="sm">Order #{(lastCompletedSale._id || lastCompletedSale.id || '').toString().slice(-8)} completed for ₹{(lastCompletedSale.total || lastCompletedSale.totalAmount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
              </Box>
              <Button size="sm" colorScheme="blue" onClick={() => downloadSaleReceipt(lastCompletedSale)} leftIcon={<Download size={14} />} mr={2}>
                Download Receipt
              </Button>
              <Button size="sm" variant="ghost" onClick={() => {
                setLastCompletedSale(null);
                navigate('/pos');
              }}>
                Dismiss
              </Button>
            </Alert>
          </SlideFade>
        )}

        {/* Search & Filter Bar */}
        <SlideFade in={true} offsetY="-20px">
          <Card borderRadius="2xl" shadow="sm" border="1px solid" borderColor="gray.100">
            <CardBody p={{ base: 3, md: 4 }}>
              <Flex gap={{ base: 2, md: 4 }} align="center" direction={{ base: "column", md: "row" }}>
                <InputGroup size={{ base: "md", md: "lg" }} w="full">
                  <InputLeftElement pointerEvents="none" w={{ base: "2.5rem", md: "3rem" }}>
                    <Search color="gray" size={18} />
                  </InputLeftElement>
                  <Input
                    ref={searchInputRef}
                    id="search-input"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    borderRadius="xl"
                    focusBorderColor="brand.500"
                    bg="gray.50"
                    pl={{ base: "2.75rem", md: "3.25rem" }}
                  />
                  <InputRightElement width="auto" mr={2}>
                    <IconButton size="sm" icon={<Scan size={16} />} onClick={onScannerOpen} variant="ghost" aria-label="Scan" />
                  </InputRightElement>
                </InputGroup>

                {/* Discount Quick Actions - Horizontal Scroll on Mobile */}
                <HStack w={{ base: "full", md: "auto" }} overflowX="auto" spacing={2} pb={{ base: 2, md: 0 }}>
                  <Button size="sm" variant="ghost" colorScheme="purple" onClick={() => applyCartDiscount(5)} flexShrink={0}>5%</Button>
                  <Button size="sm" variant="ghost" colorScheme="purple" onClick={() => applyCartDiscount(10)} flexShrink={0}>10%</Button>
                </HStack>
              </Flex>

              <Divider my={3} />

              <CategoryFilter
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />
            </CardBody>
          </Card>
        </SlideFade>

        {/* Product Grid */}
        <Box
          flex="1"
          overflowY={{ base: "visible", lg: "auto" }}
          pr={{ lg: 1 }}
          pb={4}
          minH={{ base: "500px", lg: "0" }}
        >
          {filteredProducts.length === 0 ? (
            <Center h="300px" flexDirection="column">
              <Package size={48} color="gray" />
              <Text mt={4} color="gray.500">No products found</Text>
            </Center>
          ) : (
            <SimpleGrid columns={{ base: 2, md: 3, lg: 3, xl: 4 }} gap={{ base: 2, md: 4 }}>
              {filteredProducts.map(product => (
                <ProductCard
                  key={product._id || product.id}
                  product={product}
                  onAdd={handleAddToCart}
                  onQuickBuy={handleProductQuickBuy}
                  isActive={cart.some(i => (i._id || i.id) === (product._id || product.id))}
                />
              ))}
            </SimpleGrid>
          )}
        </Box>
      </Box>

      {/* RIGHT SECTION - DESKTOP CART */}
      <Box
        w="400px"
        bg="white"
        borderLeft="1px solid"
        borderColor="gray.200"
        display={{ base: "none", lg: "flex" }}
        flexDirection="column"
        shadow="xl"
        zIndex={10}
      >
        <CartHeader
          cart={cart}
          finalTotal={finalTotal}
          onQuickBuy={handleCartQuickBuy}
          onClearCart={handleClearCart}
          selectedCustomerId={selectedCustomerId}
          customers={customers}
          onRemoveCustomer={() => setSelectedCustomerId('')}
          onSelectCustomer={onCustomerModalOpen}
        />

        {/* Cart Items List */}
        <Box flex="1" overflowY="auto" p={4} bg="gray.50">
          {cart.length === 0 ? (
            <Center h="full" flexDirection="column" opacity={0.6}>
              <ShoppingBag size={48} color="gray" />
              <Text mt={4} fontWeight="medium" color="gray.500">Cart is empty</Text>
            </Center>
          ) : (
            <VStack spacing={0} align="stretch">
              {cart.map(item => (
                <CartItem
                  key={item._id || item.id}
                  item={item}
                  onUpdateQuantity={updateCartQuantity}
                  onRemove={removeFromCart}
                />
              ))}
            </VStack>
          )}
        </Box>

        {/* Totals Section */}
        <Box p={5} bg="white" borderTop="1px solid" borderColor="gray.100" shadow="0 -4px 10px rgba(0,0,0,0.05)">
          <VStack spacing={2} mb={4}>
            <Flex w="full" justify="space-between" fontSize="sm" color="gray.600">
              <Text>Subtotal</Text>
              <Text fontWeight="600">₹{cartSubtotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
            </Flex>
            {discount > 0 && (
              <Flex w="full" justify="space-between" fontSize="sm" color="green.500">
                <Text>Discount ({discount}%)</Text>
                <Text fontWeight="600">-₹{cartDiscountAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
              </Flex>
            )}
            <Flex w="full" justify="space-between" fontSize="sm" color="gray.600">
              <Text>Tax ({tax}%)</Text>
              <Text fontWeight="600">₹{taxAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
            </Flex>
            <Divider />
            <Flex w="full" justify="space-between" align="center">
              <Text fontSize="lg" fontWeight="800" color="gray.800">Total</Text>
              <Text fontSize="2xl" fontWeight="900" color="brand.600">₹{finalTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
            </Flex>
          </VStack>

          <Button
            w="full"
            size="lg"
            colorScheme="brand"
            id="quick-buy-btn"
            rightIcon={<ChevronRight />}
            onClick={onCheckoutOpen}
            isDisabled={cart.length === 0}
            bgGradient="linear(to-r, brand.500, brand.600)"
            _hover={{ bgGradient: 'linear(to-r, brand.600, brand.700)', shadow: 'lg', transform: 'translateY(-2px)' }}
            transition="all 0.2s"
          >
            Checkout (F4)
          </Button>
        </Box>
      </Box>

      {/* MOBILE BOTTOM BAR */}
      <MobileBottomBar />

      {/* MOBILE CART DRAWER */}
      <Drawer isOpen={isCartOpen} placement="bottom" onClose={onCartClose} size="full">
        <DrawerOverlay />
        <DrawerContent borderTopRadius="2xl">
          <DrawerCloseButton color="white" zIndex={2} />
          <CartHeader
            cart={cart}
            finalTotal={finalTotal}
            onQuickBuy={handleCartQuickBuy}
            onClearCart={clearCart}
            selectedCustomerId={selectedCustomerId}
            customers={customers}
            onRemoveCustomer={() => setSelectedCustomerId('')}
            onSelectCustomer={onCustomerModalOpen}
          />
          <DrawerBody bg="gray.50" p={2}>
            {/* Reusing Cart Items Logic for Mobile */}
            <VStack spacing={0} align="stretch" pb={20}>
              {cart.map(item => (
                <CartItem
                  key={item._id || item.id}
                  item={item}
                  onUpdateQuantity={updateCartQuantity}
                  onRemove={removeFromCart}
                />
              ))}
            </VStack>
          </DrawerBody>
          <Box position="absolute" bottom={0} left={0} right={0} p={4} bg="white" borderTop="1px solid" borderColor="gray.200" pb={8}>
            <Flex justify="space-between" mb={2}>
              <Text fontWeight="bold">Total</Text>
              <Text fontWeight="900" fontSize="xl" color="brand.600">₹{finalTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
            </Flex>
            <Button w="full" size="lg" colorScheme="brand" onClick={() => { onCartClose(); onCheckoutOpen(); }}>
              Proceed to Checkout
            </Button>
          </Box>
        </DrawerContent>
      </Drawer>

      {/* --- MODALS --- */}

      {/* Customer Selection Modal */}
      <Modal isOpen={isCustomerModalOpen} onClose={onCustomerModalClose} size="lg" scrollBehavior="inside">
        <ModalOverlay backdropFilter="blur(5px)" />
        <ModalContent borderRadius="2xl">
          <ModalHeader>Select Customer</ModalHeader>
          <ModalBody>
            <InputGroup mb={4}>
              <InputLeftElement><Search size={18} /></InputLeftElement>
              <Input
                placeholder="Search customer by name or phone..."
                borderRadius="xl"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
              />
            </InputGroup>
            <VStack spacing={2} align="stretch" maxH="400px" overflowY="auto">
              {customers
                .filter(c => {
                  const s = customerSearch.toLowerCase();
                  return (c.name?.toLowerCase().includes(s) || c.phone?.toLowerCase().includes(s));
                })
                .map(c => (
                  <Flex
                    key={c._id || c.id}
                    p={3}
                    bg="gray.50"
                    borderRadius="xl"
                    align="center"
                    gap={3}
                    cursor="pointer"
                    _hover={{ bg: 'brand.50', borderColor: 'brand.200' }}
                    border="1px solid"
                    borderColor="transparent"
                    onClick={() => { setSelectedCustomerId(c._id || c.id); onCustomerModalClose(); }}
                  >
                    <Avatar name={c.name} size="md" bg="brand.200" color="brand.700" />
                    <Box flex="1">
                      <Text fontWeight="bold">{c.name}</Text>
                      <Text fontSize="xs" color="gray.500">{c.email} • {c.phone}</Text>
                    </Box>
                    <Badge colorScheme={c.tier === 'Gold' ? 'yellow' : 'gray'}>{c.tier}</Badge>
                  </Flex>
                ))}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Checkout Modal */}
      <Modal isOpen={isCheckoutOpen} onClose={handleCheckoutClose} size="xl" isCentered>
        <ModalOverlay backdropFilter="blur(8px)" />
        <ModalContent borderRadius="3xl" overflow="hidden">
          <ModalHeader bg="gray.50" borderBottom="1px solid" borderColor="gray.100" py={6}>
            <Flex align="center" gap={3}>
              <Box p={2} bg="brand.100" borderRadius="xl"><ShoppingBag size={20} color="#2563eb" /></Box>
              <Box>
                <Heading size="md" fontWeight="800">Complete Payment</Heading>
                <Text fontSize="2xl" fontWeight="bold" color="brand.600" mt={2}>Total Amount: ₹{finalTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
              </Box>
            </Flex>
          </ModalHeader>

          <ModalBody p={6}>
            {/* [FEATURE #13] Mall-Wide Loyalty Point Redemption */}
            {selectedCustomerId && (customers.find(c => c._id === selectedCustomerId || c.id === selectedCustomerId)?.loyaltyPoints > 0) && (
              <Box mb={6} p={4} bg="brand.50" borderRadius="xl" border="1px dashed" borderColor="brand.200">
                <Flex justify="space-between" align="center" mb={2}>
                  <Flex align="center" gap={2}>
                    <Award size={18} color="#2563eb" />
                    <Text fontWeight="bold" color="brand.800">Mall-Wide Loyalty Points</Text>
                  </Flex>
                  <Badge colorScheme="brand" fontSize="sm">
                    {customers.find(c => c._id === selectedCustomerId || c.id === selectedCustomerId)?.loyaltyPoints || 0} Available
                  </Badge>
                </Flex>
                <Text fontSize="sm" color="gray.600" mb={3}>
                  Apply points for a flat discount (1 Pt = ₹1).
                </Text>
                <HStack>
                  <Input
                    type="number"
                    placeholder="Points to apply..."
                    value={pointsRedeemed || ''}
                    onChange={(e) => {
                      const maxAllowed = Math.floor(Math.min(
                        customers.find(c => c._id === selectedCustomerId || c.id === selectedCustomerId)?.loyaltyPoints || 0,
                        finalTotalBeforePoints
                      ));
                      const val = Math.max(0, Math.min(Number(e.target.value), maxAllowed));
                      setPointsRedeemed(val);
                    }}
                    bg="white"
                  />
                  <Button
                    colorScheme="brand"
                    variant={pointsRedeemed > 0 ? "outline" : "solid"}
                    onClick={() => {
                      if (pointsRedeemed > 0) {
                        setPointsRedeemed(0);
                      } else {
                        const maxAllowed = Math.floor(Math.min(
                          customers.find(c => c._id === selectedCustomerId || c.id === selectedCustomerId)?.loyaltyPoints || 0,
                          finalTotalBeforePoints
                        ));
                        setPointsRedeemed(maxAllowed);
                      }
                    }}
                  >
                    {pointsRedeemed > 0 ? "Remove" : "Max"}
                  </Button>
                </HStack>
                {pointsRedeemed > 0 && (
                  <Text mt={2} fontSize="sm" fontWeight="bold" color="green.600">
                    -₹{pointsRedeemed.toLocaleString('en-IN', { maximumFractionDigits: 0 })} Points Discount Linked!
                  </Text>
                )}
              </Box>
            )}

            <Tabs
              variant="soft-rounded"
              colorScheme="brand"
              index={(paymentMethod || 'cash').toLowerCase() === 'upi' ? 1 : 0}
              onChange={(i) => {
                if (i === 0) setPaymentMethod('cash');
                if (i === 1) { setPaymentMethod('upi'); setCashReceived(''); }
              }}
            >
              <TabList mb={6} bg="gray.100" p={1} borderRadius="xl">
                <Tab w="full" _selected={{ bg: 'white', shadow: 'sm', color: 'brand.600' }}>Cash</Tab>
                <Tab w="full" isDisabled={!upiEnabled} _selected={{ bg: 'white', shadow: 'sm', color: 'brand.600' }}>UPI</Tab>
              </TabList>

              <TabPanels>
                <TabPanel p={0}>
                  <FormControl mb={6}>
                    <FormLabel fontWeight="bold">Cash Received</FormLabel>
                    <InputGroup size="lg">
                      <InputLeftElement><DollarSign size={18} /></InputLeftElement>
                      <Input
                        type="number"
                        placeholder="0.00"
                        fontWeight="bold"
                        fontSize="xl"
                        value={cashReceived}
                        onChange={(e) => setCashReceived(e.target.value)}
                        autoFocus
                      />
                    </InputGroup>
                    {parseFloat(cashReceived) >= finalTotal && (
                      <ScaleFade in={true}>
                        <Alert status="success" variant="left-accent" mt={4} borderRadius="lg">
                          <AlertIcon />
                          <Box>
                            <AlertTitle>Change to Return</AlertTitle>
                            <AlertDescription fontWeight="900" fontSize="2xl">
                              ₹{(parseFloat(cashReceived) - finalTotal).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </AlertDescription>
                          </Box>
                        </Alert>
                      </ScaleFade>
                    )}
                  </FormControl>
                </TabPanel>
                <TabPanel p={0}>
                  {!upiEnabled ? (
                    <Alert status="warning" borderRadius="xl">
                      <AlertIcon />
                      <Box>
                        <AlertTitle>UPI Disabled</AlertTitle>
                        <AlertDescription fontSize="sm">
                          Enable UPI in Settings to use this payment method.
                        </AlertDescription>
                      </Box>
                    </Alert>
                  ) : (
                    <>
                      <Alert status="info" borderRadius="xl" mb={4}>
                        <AlertIcon />
                        <Box>
                          <AlertTitle>UPI Payment</AlertTitle>
                          <AlertDescription fontSize="sm">
                            Collect the payment in your UPI app, then confirm the sale here.
                          </AlertDescription>
                        </Box>
                      </Alert>
                      <FormControl mb={2}>
                        <FormLabel fontWeight="bold">UPI Reference (Optional)</FormLabel>
                        <Input
                          placeholder="Transaction / UTR reference"
                          value={upiRef}
                          onChange={(e) => setUpiRef(e.target.value)}
                          bg="white"
                        />
                        <Text fontSize="xs" color="gray.500" mt={2}>
                          This will be saved in the sale notes for tracking.
                        </Text>
                      </FormControl>
                    </>
                  )}
                </TabPanel>
              </TabPanels>
            </Tabs>

            <FormControl mt={4}>
              <FormLabel fontSize="sm" color="gray.500">Add Note (Optional)</FormLabel>
              <Input
                variant="filled"
                size="sm"
                placeholder="Order notes..."
                value={saleNotes}
                onChange={(e) => setSaleNotes(e.target.value)}
              />
            </FormControl>
          </ModalBody>

          <ModalFooter bg="gray.50" p={6} flexDirection={{ base: 'column', sm: 'row' }} gap={3}>
            <Button size="lg" variant="ghost" onClick={handleCheckoutClose} color="gray.500" w={{ base: 'full', sm: 'auto' }}>Cancel</Button>
            <Button
              size="lg"
              colorScheme="orange"
              onClick={handleSaveAsPending}
              isLoading={isProcessing}
              leftIcon={<Clock size={18} />}
              w={{ base: 'full', sm: 'auto' }}
            >
              Save as Pending
            </Button>
            <Button
              size="lg"
              colorScheme="brand"
              onClick={handleCheckout}
              isLoading={isProcessing}
              w={{ base: 'full', sm: '200px' }}
              bgGradient="linear(to-r, brand.600, brand.500)"
              shadow="lg"
              _hover={{ shadow: 'xl', transform: 'translateY(-2px)' }}
            >
              Confirm
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Quick Buy Modal - (Similar structure to checkout but streamlined) */}
      <Modal isOpen={isQuickBuyOpen} onClose={onQuickBuyClose} size="md" isCentered>
        <ModalOverlay backdropFilter="blur(5px)" />
        <ModalContent borderRadius="2xl">
          <ModalHeader>Express Checkout</ModalHeader>
          <ModalBody>
            <Alert status="info" borderRadius="xl" mb={4}>
              <AlertIcon />
              <Text fontSize="2xl" fontWeight="bold" color="brand.600">Total Amount: ₹{finalTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
            </Alert>
            <Button size="lg" w="full" colorScheme="green" onClick={() => handleQuickBuyConfirm('cash', finalTotal)} mb={3} leftIcon={<DollarSign />}>
              Pay Exact Cash
            </Button>
            <Button size="lg" w="full" colorScheme="blue" onClick={() => handleQuickBuyConfirm('upi', '')} mb={3}>
              UPI Payment
            </Button>
            <Button size="lg" w="full" colorScheme="blue" variant="outline" onClick={() => { onQuickBuyClose(); onCheckoutOpen(); }}>
              Other Options
            </Button>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* [FEATURE #5] Real Barcode / QR Scanner Drawer */}
      <Drawer isOpen={isScannerOpen} placement="bottom" onClose={onScannerClose} size="md">
        <DrawerOverlay />
        <DrawerContent borderTopRadius="2xl">
          <DrawerHeader pb={2}>
            Scan Barcode / QR Code
          </DrawerHeader>
          <DrawerBody pb={8}>
            <BarcodeScanner
              onProductFound={(product) => {
                handleAddToCart(product);
              }}
              onError={(msg) => console.warn('[Scanner]', msg)}
            />
          </DrawerBody>
        </DrawerContent>
      </Drawer>

    </Box>
  );
}
