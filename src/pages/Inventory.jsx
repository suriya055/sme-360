import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Box, Heading, Button, Table, Thead, Tbody, Tr, Th, Td,
  Badge, Image, Flex, Input, InputGroup, InputLeftElement,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody,
  ModalFooter, useDisclosure, FormControl, FormLabel,
  Select, Text, IconButton, Menu, MenuButton, MenuList,
  MenuItem, Alert, AlertIcon, AlertTitle, AlertDescription,
  Card, CardBody, SimpleGrid, Stat, StatNumber, StatHelpText,
  Progress, Tooltip, HStack, VStack, Textarea, NumberInput,
  NumberInputField, NumberInputStepper, NumberIncrementStepper,
  NumberDecrementStepper, Tag, Divider,
  Tabs, TabList, TabPanels, Tab, TabPanel, Switch,
  Drawer, DrawerBody, DrawerHeader, DrawerOverlay,
  DrawerContent, DrawerCloseButton, useColorModeValue,
  useToast, Center, ScaleFade
} from '@chakra-ui/react';
import {
  Plus, Search, Filter, Edit, Trash2, Eye,
  Package, TrendingDown, BarChart3,
  Download, Upload, Copy, AlertTriangle, CheckCircle,
  MoreVertical, Grid, List, QrCode,
  Tag as TagIcon, Hash, ImageOff
} from 'lucide-react';
import { useApp } from '../hooks/useApp';
import { useForm } from 'react-hook-form';
import ImageWithFallback from '../components/common/ImageWithFallback';

// Enhanced Product Card Component (Grid View)
const ProductCard = ({ product, onEdit, onView, onDelete }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const [imgError, setImgError] = useState(false);

  const getStockStatus = (stock, threshold) => {
    if (stock === 0) return { color: 'red.500', label: 'Out of Stock', badge: 'red' };
    if (stock <= threshold) return { color: 'orange.500', label: 'Low Stock', badge: 'orange' };
    if (stock > threshold && stock <= threshold * 3) return { color: 'yellow.500', label: 'Medium Stock', badge: 'yellow' };
    return { color: 'green.500', label: 'In Stock', badge: 'green' };
  };

  const stockStatus = getStockStatus(product.stock, product.lowStockThreshold || 10);
  const stockPercentage = Math.min((product.stock / 50) * 100, 100);

  const { hasPermission } = useApp();

  return (
    <Card
      borderRadius="xl"
      border="1px solid"
      borderColor="gray.200"
      shadow="sm"
      _hover={{
        transform: 'translateY(-2px)',
        shadow: 'md',
        borderColor: 'brand.300'
      }}
      transition="all 0.2s"
      position="relative"
      overflow="hidden"
      bg="white"
    >
      <CardBody p={4}>
        <Flex justify="space-between" align="start" mb={3}>
          <Badge
            colorScheme={stockStatus.badge}
            variant="subtle"
            fontSize="xs"
            px={2}
            py={0.5}
            borderRadius="full"
            letterSpacing="wide"
            textTransform="uppercase"
            fontWeight="bold"
          >
            {stockStatus.label}
          </Badge>
          <Menu>
            <MenuButton
              as={IconButton}
              icon={<MoreVertical size={16} />}
              variant="ghost"
              size="sm"
              borderRadius="full"
              color="gray.500"
            />
            <MenuList minW="150px" fontSize="sm">
              <MenuItem icon={<Eye size={14} />} onClick={() => onView(product)}>
                View Details
              </MenuItem>
              {hasPermission('canManageProducts') && (
                <>
                  <MenuItem icon={<Edit size={14} />} onClick={() => onEdit(product)}>
                    Edit
                  </MenuItem>
                  <MenuItem icon={<QrCode size={14} />}>
                    Generate QR Code
                  </MenuItem>
                  <MenuItem icon={<Copy size={14} />}>
                    Duplicate
                  </MenuItem>
                </>
              )}
              <Divider />
              {(hasPermission('canManageProducts') || hasPermission('canDeleteRecords')) && (
                <MenuItem
                  icon={<Trash2 size={14} />}
                  color="red.500"
                  onClick={() => onDelete(product._id || product.id)}
                >
                  Delete
                </MenuItem>
              )}
            </MenuList>
          </Menu>
        </Flex>

        <Box mb={4} h="140px" w="100%" borderRadius="lg" overflow="hidden" position="relative" bg="gray.50">
          <ImageWithFallback
            src={product.image}
            alt={product.name}
            h="100%"
            w="100%"
            transition="transform 0.3s"
            _hover={{ transform: 'scale(1.05)' }}
          />
        </Box>

        <VStack align="start" spacing={1} mb={3}>
          <Heading size="sm" noOfLines={1} color="gray.800" fontWeight="700">
            {product.name}
          </Heading>
          <Text fontSize="xs" color="gray.500" noOfLines={1}>
            {product.category || 'Uncategorized'} • {product.sku || 'No SKU'}
          </Text>
        </VStack>

        <Flex justify="space-between" align="end">
          <Box>
            <Text fontSize="xs" color="gray.500" fontWeight="500">Price</Text>
            <Text fontSize="md" fontWeight="800" color="gray.900">
              ₹{product.price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </Text>
          </Box>
          <Box textAlign="right">
            <Text fontSize="xs" color="gray.500" fontWeight="500">Stock</Text>
            <Text fontSize="sm" fontWeight="700" color={stockStatus.color}>
              {product.stock}
            </Text>
          </Box>
        </Flex>

        <Box mt={3}>
          <Progress
            value={stockPercentage}
            colorScheme={
              stockStatus.badge === 'green' ? 'green' :
                stockStatus.badge === 'yellow' ? 'yellow' :
                  stockStatus.badge === 'orange' ? 'orange' : 'red'
            }
            size="xs"
            borderRadius="full"
            bg="gray.100"
          />
        </Box>
      </CardBody>
    </Card>
  );
};

// Inventory Row Component (List View) to handle Image State independently
const InventoryRow = ({ product, isSelected, onToggleSelect, onView, onEdit, onDelete }) => {
  const [imgError, setImgError] = useState(false);
  const stockValue = (product.price || 0) * (product.stock || 0);
  const stockStatus = (product.stock || 0) === 0 ? 'red' :
    (product.stock || 0) <= (product.lowStockThreshold || 10) ? 'orange' : 'green';

  return (
    <Tr _hover={{ bg: 'gray.50' }}>
      <Td>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(product._id || product.id)}
        />
      </Td>
      <Td>
        <Flex align="center" gap={3}>
          <Box boxSize="40px" borderRadius="md" overflow="hidden" flexShrink={0}>
            <ImageWithFallback
              src={product.image}
              alt={product.name}
              w="100%"
              h="100%"
            />
          </Box>
          <Box>
            <Text fontWeight="medium" noOfLines={1}>{product.name || 'Unnamed Product'}</Text>
            <Text fontSize="xs" color="gray.500">{product.sku || 'No SKU'}</Text>
          </Box>
        </Flex>
      </Td>
      <Td>
        <Badge variant="subtle" colorScheme="blue">
          {product.category || 'Uncategorized'}
        </Badge>
      </Td>
      <Td isNumeric fontWeight="bold">₹{(product.price || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Td>
      <Td isNumeric>
        <Flex align="center" justify="flex-end" gap={2}>
          <Text>{product.stock || 0}</Text>
          <Progress
            value={Math.min(((product.stock || 0) / 50) * 100, 100)}
            w="60px"
            size="sm"
            colorScheme={stockStatus}
          />
        </Flex>
      </Td>
      <Td isNumeric fontWeight="bold" color="green.600">
        ₹{stockValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
      </Td>
      <Td>
        <Badge colorScheme={stockStatus} fontSize="xs">
          {(product.stock || 0) === 0 ? 'Out of Stock' :
            (product.stock || 0) <= (product.lowStockThreshold || 10) ? 'Low Stock' : 'In Stock'}
        </Badge>
      </Td>
      <Td>
        <HStack spacing={1}>
          <IconButton
            icon={<Eye size={14} />}
            size="sm"
            variant="ghost"
            onClick={() => onView(product)}
            aria-label="View"
          />
          <IconButton
            icon={<Edit size={14} />}
            size="sm"
            variant="ghost"
            onClick={() => onEdit(product)}
            aria-label="Edit"
          />
          <IconButton
            icon={<Trash2 size={14} />}
            size="sm"
            variant="ghost"
            colorScheme="red"
            onClick={() => onDelete(product._id || product.id)}
            aria-label="Delete"
          />
        </HStack>
      </Td>
    </Tr>
  );
};

// Quick Stats Component
const InventoryStats = ({ products }) => {
  const stats = useMemo(() => {
    const totalValue = products.reduce((sum, p) => sum + (p.price * (p.stock || 0)), 0);
    const lowStockCount = products.filter(p => (p.stock || 0) <= (p.lowStockThreshold || 10) && (p.stock || 0) > 0).length;
    const outOfStockCount = products.filter(p => (p.stock || 0) === 0).length;
    const categories = [...new Set(products.map(p => p.category || 'Uncategorized'))];
    const avgStock = products.length > 0 ?
      products.reduce((sum, p) => sum + (p.stock || 0), 0) / products.length : 0;

    return {
      totalValue,
      lowStockCount,
      outOfStockCount,
      categoryCount: categories.length,
      avgStock,
      totalProducts: products.length
    };
  }, [products]);

  return (
    <SimpleGrid columns={{ base: 2, md: 3, lg: 6 }} spacing={4} mb={8}>
      {[
        { label: 'Total Value', value: `₹${stats.totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, sub: 'Inventory Value', icon: Package, color: 'blue' },
        { label: 'Products', value: stats.totalProducts, sub: 'Total SKU', icon: CheckCircle, color: 'green' },
        { label: 'Low Stock', value: stats.lowStockCount, sub: 'Needs Reorder', icon: AlertTriangle, color: 'orange' },
        { label: 'Out of Stock', value: stats.outOfStockCount, sub: 'Critical', icon: TrendingDown, color: 'red' },
        { label: 'Avg Stock', value: Math.round(stats.avgStock), sub: 'Per Product', icon: Hash, color: 'purple' },
        { label: 'Categories', value: stats.categoryCount, sub: 'Active', icon: TagIcon, color: 'pink' },
      ].map((stat, idx) => (
        <Card
          key={idx}
          borderRadius="xl"
          border="1px solid"
          borderColor="gray.200"
          shadow="sm"
          _hover={{ shadow: 'md', borderColor: `${stat.color}.300` }}
          transition="all 0.2s"
        >
          <CardBody p={4}>
            <Flex align="center" justify="space-between" mb={2}>
              <Flex
                w="36px"
                h="36px"
                align="center"
                justify="center"
                bg={`${stat.color}.50`}
                color={`${stat.color}.500`}
                borderRadius="lg"
              >
                <stat.icon size={18} />
              </Flex>
            </Flex>
            <Box>
              <Heading size="md" color="gray.800" fontWeight="700">
                {stat.value}
              </Heading>
              <Text fontSize="xs" color="gray.500" fontWeight="500" mt={1}>
                {stat.sub}
              </Text>
            </Box>
          </CardBody>
        </Card>
      ))}
    </SimpleGrid>
  );
};

export default function Inventory() {
  const { products, addProduct, updateProduct, deleteProduct, importProducts, useBackendAPI, hasPermission } = useApp();
  const fileInputRef = useRef(null);
  const [filter, setFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [selectedImgError, setSelectedImgError] = useState(false);

  // Reset image error when selected product changes
  useEffect(() => {
    if (selectedProduct) setSelectedImgError(false);
  }, [selectedProduct]);

  const {
    isOpen: isAddOpen,
    onOpen: onAddOpen,
    onClose: onAddClose
  } = useDisclosure();

  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose
  } = useDisclosure();

  const {
    isOpen: isViewOpen,
    onOpen: onViewOpen,
    onClose: onViewClose
  } = useDisclosure();

  const {
    isOpen: isBulkOpen,
    onOpen: onBulkOpen,
    onClose: onBulkClose
  } = useDisclosure();

  const initialFormValues = {
    name: '',
    description: '',
    category: 'Electronics',
    price: 0,
    cost: 0,
    stock: 0,
    lowStockThreshold: 10,
    sku: '',
    image: '',
    barcode: '',
    trackInventory: true,
    notifyLowStock: true
  };

  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: initialFormValues
  });
  const watchedImage = watch('image');

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image under 5MB",
          status: "error",
          duration: 3000,
        });
        return;
      }

      // Resize image to 800x800 for consistency
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Create canvas for resizing
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          // Set target size (square for product images)
          const targetSize = 800;
          canvas.width = targetSize;
          canvas.height = targetSize;

          // Calculate dimensions to maintain aspect ratio and fill square
          let sourceX = 0;
          let sourceY = 0;
          let sourceWidth = img.width;
          let sourceHeight = img.height;

          // Crop to square (center crop)
          if (img.width > img.height) {
            sourceX = (img.width - img.height) / 2;
            sourceWidth = img.height;
          } else if (img.height > img.width) {
            sourceY = (img.height - img.width) / 2;
            sourceHeight = img.width;
          }

          // Draw image on canvas (resized and cropped)
          ctx.drawImage(
            img,
            sourceX, sourceY, sourceWidth, sourceHeight,
            0, 0, targetSize, targetSize
          );

          // Create preview and store base64 string directly in 'image'
          const previewUrl = canvas.toDataURL('image/jpeg', 0.9);
          setValue('image', previewUrl, { shouldValidate: true, shouldDirty: true });

          // Clear the file input from hook form so it doesn't conflict
          setValue('imageFile', null);

          toast({
            title: "Image processed",
            description: `Resized to ${targetSize}x${targetSize}px`,
            status: "success",
            duration: 2000,
          });
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const toast = useToast();

  // Get unique categories
  const categories = ['all', ...new Set(products.map(p => p.category || 'Uncategorized'))];

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Text filter
    if (filter) {
      result = result.filter(p =>
        p.name?.toLowerCase().includes(filter.toLowerCase()) ||
        p.sku?.toLowerCase().includes(filter.toLowerCase()) ||
        p.description?.toLowerCase().includes(filter.toLowerCase()) ||
        p.category?.toLowerCase().includes(filter.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter(p => (p.category || 'Uncategorized') === selectedCategory);
    }

    // Stock filter
    switch (stockFilter) {
      case 'low':
        result = result.filter(p => (p.stock || 0) <= (p.lowStockThreshold || 10) && (p.stock || 0) > 0);
        break;
      case 'out':
        result = result.filter(p => (p.stock || 0) === 0);
        break;
      case 'in':
        result = result.filter(p => (p.stock || 0) > (p.lowStockThreshold || 10));
        break;
    }

    // Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'price_high':
          return (b.price || 0) - (a.price || 0);
        case 'price_low':
          return (a.price || 0) - (b.price || 0);
        case 'stock_high':
          return (b.stock || 0) - (a.stock || 0);
        case 'stock_low':
          return (a.stock || 0) - (b.stock || 0);
        case 'recent':
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [products, filter, selectedCategory, stockFilter, sortBy]);

  // Handle form submission for adding/editing
  const onSubmit = async (data) => {
    try {
      let productData = {
        ...data,
        price: parseFloat(data.price) || 0,
        cost: parseFloat(data.cost) || 0,
        stock: parseInt(data.stock) || 0,
        lowStockThreshold: parseInt(data.lowStockThreshold) || 10,
        sku: data.sku || `SKU-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        lastRestocked: new Date().toISOString()
      };

      // Handle Image Upload
      const imageFile = data.imageFile && data.imageFile[0];

      if (useBackendAPI) {
        const formData = new FormData();

        // Append regular fields (avoid sending null/empty strings which become "null" in multipart FormData).
        Object.keys(productData).forEach((key) => {
          if (key === 'imageFile' || key === 'image') return;
          const v = productData[key];
          if (v === undefined || v === null) return;
          if (typeof v === 'string' && v.trim() === '') return;
          formData.append(key, v);
        });

        // Append image if we have one
        if (data.image && data.image.startsWith('data:image')) {
          // It's a base64 string from our resizer, convert to Blob
          const res = await fetch(data.image);
          const blob = await res.blob();
          const file = new File([blob], "image.jpg", { type: "image/jpeg" });
          formData.append('image', file);
        } else if (imageFile) {
          // Raw file fallback
          formData.append('image', imageFile);
        } else if (selectedProduct?.image) {
          formData.append('existingImage', selectedProduct.image);
        }

        productData = formData;
      } else {
        if (data.image && data.image.startsWith('data:image')) {
          productData.image = data.image;
        } else if (imageFile) {
          const toBase64 = (file) => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
          });
          productData.image = await toBase64(imageFile);
        } else {
          if (!productData.image && selectedProduct?.image) {
            productData.image = selectedProduct.image;
          }
        }
        delete productData.imageFile;
      }

      if (selectedProduct) {
        await updateProduct(selectedProduct._id || selectedProduct.id, productData);
      } else {
        await addProduct(productData);
      }

      reset();
      onAddClose();
      onEditClose();
      setSelectedProduct(null);
    } catch (error) {
      console.error("Error saving product:", error);
      // AppContext handles the error toast
    }
  };

  // Handle product edit
  const handleEdit = (product) => {
    setSelectedProduct(product);
    // Set form values
    Object.keys(product).forEach(key => {
      if (product[key] !== undefined) {
        setValue(key, product[key]);
      }
    });
    if (product.cost !== undefined) {
      setValue('cost', product.cost);
    } else if (product.costPrice !== undefined) {
      setValue('cost', product.costPrice);
    }
    setValue('imageFile', null);
    onEditOpen();
  };

  // Handle product view
  const handleView = (product) => {
    setSelectedProduct(product);
    onViewOpen();
  };

  // Handle product delete
  const handleDelete = (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      deleteProduct(productId);
      toast({ title: "Product deleted", status: "success", duration: 3000, isClosable: true });
    }
  };

  // Handle bulk actions
  const handleBulkAction = () => {
    if (selectedItems.length === 0) {
      toast({ title: "No items selected", status: "error", duration: 3000 });
      return;
    }

    switch (bulkAction) {
      case 'delete':
        if (window.confirm(`Delete ${selectedItems.length} products?`)) {
          selectedItems.forEach(id => deleteProduct(id));
          setSelectedItems([]);
          toast({ title: "Products deleted", status: "success", duration: 3000 });
        }
        break;
      default:
        toast({ title: "Feature coming soon", status: "info", duration: 3000 });
        break;
    }

    onBulkClose();
  };

  // Toggle item selection
  const toggleItemSelection = (productId) => {
    setSelectedItems(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // Select all items
  const selectAllItems = () => {
    if (selectedItems.length === filteredProducts.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredProducts.map(p => p._id || p.id));
    }
  };

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8,"
      + ["Name,SKU,Category,Price,Stock,Status"].join(",") + "\n"
      + products.map(p => [
        `"${p.name}"`,
        p.sku || 'N/A',
        p.category || 'Uncategorized',
        p.price || 0,
        p.stock || 0,
        (p.stock || 0) === 0 ? 'Out of Stock' :
          (p.stock || 0) <= (p.lowStockThreshold || 10) ? 'Low Stock' : 'In Stock'
      ].join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `inventory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Export successful", status: "success", duration: 3000 });
  };

  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Use backend import if available
    if (useBackendAPI) {
      const loadingToast = toast({ title: "Uploading...", status: "loading", duration: null });
      const success = await importProducts(file);
      toast.close(loadingToast);
      if (success) {
        event.target.value = null; // Reset input
        return;
      }
    }

    // Client-side fallback logic
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      const lines = content.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

      // Dynamic column mapping based on headers
      const nameIdx = headers.findIndex(h => h.includes('name'));
      const skuIdx = headers.findIndex(h => h.includes('sku') || h.includes('code'));
      const catIdx = headers.findIndex(h => h.includes('category'));
      const priceIdx = headers.findIndex(h => h.includes('price') || h.includes('selling'));
      const costIdx = headers.findIndex(h => h.includes('cost') || h.includes('buy') || h.includes('purchase'));
      const stockIdx = headers.findIndex(h => h.includes('stock') || h.includes('qty'));

      let successCount = 0;
      const loadingToast = toast({ title: "Importing...", status: "loading", duration: null });

      // Process each line
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(',');

          const getVal = (idx, fallbackIdx) => {
            if (idx !== -1 && values[idx] !== undefined) return values[idx].replace(/"/g, '').trim();
            if (fallbackIdx !== undefined && values[fallbackIdx] !== undefined) return values[fallbackIdx].replace(/"/g, '').trim();
            return '';
          };

          const name = getVal(nameIdx, 0) || `Product ${i}`;
          const stock = parseInt(getVal(stockIdx, 4)) || 0;

          const product = {
            id: crypto.randomUUID(),
            name,
            sku: getVal(skuIdx, 1) || `SKU-${Date.now()}-${i}`,
            category: getVal(catIdx, 2) || 'Imported',
            price: parseFloat(getVal(priceIdx, 3)) || 0,
            cost: parseFloat(getVal(costIdx)) || 0,
            stock,
            lowStockThreshold: 10,
            image: '', // Let UI handle placeholder
            createdAt: new Date().toISOString(),
            lastRestocked: new Date().toISOString()
          };

          addProduct(product);
          successCount++;
        }
      }

      toast.close(loadingToast);
      toast({ title: "Import complete", description: `${successCount} products imported locally`, status: "success", duration: 5000 });
    };

    reader.readAsText(file);
    event.target.value = null;
  };

  return (
    <ScaleFade in={true} initialScale={0.95}>
      <Box minH="calc(100vh - 80px)">
        {/* Header */}
        <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ base: 'stretch', md: 'center' }} mb={8} gap={4}>
          <Box>
            <Heading size="lg" color="gray.800" fontWeight="700" letterSpacing="-0.5px">Inventory Management</Heading>
            <Text color="gray.500" mt={1}>
              {filteredProducts.length} products • {categories.length - 1} categories
            </Text>
          </Box>
          <HStack spacing={3} wrap={{ base: 'wrap', sm: 'nowrap' }}>
            <Button
              leftIcon={<Upload size={18} />}
              variant="outline"
              onClick={handleExport}
              flex={{ base: '1', sm: 'initial' }}
            >
              Export
            </Button>
            {hasPermission('canManageProducts') && (
              <Button
                leftIcon={<Download size={18} />}
                variant="outline"
                onClick={handleImportClick}
                flex={{ base: '1', sm: 'initial' }}
              >
                Import
              </Button>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv,.txt"
              style={{ display: 'none' }}
            />
            {hasPermission('canManageProducts') && (
              <Button
                leftIcon={<Plus size={18} />}
                colorScheme="brand"
                onClick={() => {
                  reset(); // Clear form
                  setSelectedProduct(null); // Ensure we're adding, not editing
                  onAddOpen();
                }}
                w={{ base: 'full', sm: 'auto' }}
              >
                Add Product
              </Button>
            )}
          </HStack>
        </Flex>

        {/* Quick Stats */}
        <InventoryStats products={products} />

        {/* Filters and Controls */}
        <Card bg={bgColor} border="1px" borderColor={borderColor} mb={6}>
          <CardBody>
            <Flex direction={{ base: 'column', lg: 'row' }} gap={4} align="center">
              {/* Search */}
              <InputGroup flex="1">
                <InputLeftElement pointerEvents="none">
                  <Search size={18} color="gray" />
                </InputLeftElement>
                <Input
                  placeholder="Search products by name, SKU, category..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  bg="white"
                />
              </InputGroup>

              {/* Category Filter */}
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                bg="white"
                minW="150px"
                w={{ base: 'full', lg: 'auto' }}
              >
                <option value="all">All Categories</option>
                {categories.slice(1).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </Select>

              {/* Stock Filter */}
              <Select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                bg="white"
                minW="150px"
                w={{ base: 'full', lg: 'auto' }}
              >
                <option value="all">All Stock</option>
                <option value="low">Low Stock</option>
                <option value="out">Out of Stock</option>
                <option value="in">In Stock</option>
              </Select>

              {/* Sort By */}
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                bg="white"
                minW="150px"
                w={{ base: 'full', lg: 'auto' }}
              >
                <option value="name">Sort by Name</option>
                <option value="price_high">Price: High to Low</option>
                <option value="price_low">Price: Low to High</option>
                <option value="stock_high">Stock: High to Low</option>
                <option value="stock_low">Stock: Low to High</option>
                <option value="recent">Recently Added</option>
              </Select>

              {/* View Toggle */}
              <HStack>
                <IconButton
                  icon={<Grid size={18} />}
                  variant={viewMode === 'grid' ? 'solid' : 'outline'}
                  colorScheme={viewMode === 'grid' ? 'brand' : 'gray'}
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid View"
                />
                <IconButton
                  icon={<List size={18} />}
                  variant={viewMode === 'list' ? 'solid' : 'outline'}
                  colorScheme={viewMode === 'list' ? 'brand' : 'gray'}
                  onClick={() => setViewMode('list')}
                  aria-label="List View"
                />
              </HStack>

              {/* Bulk Actions */}
              {selectedItems.length > 0 && (
                <Button
                  leftIcon={<Package size={18} />}
                  colorScheme="blue"
                  variant="solid"
                  onClick={onBulkOpen}
                >
                  {selectedItems.length} Selected
                </Button>
              )}
            </Flex>
          </CardBody>
        </Card>

        {/* Products Display */}
        {filteredProducts.length === 0 ? (
          <Alert status="info" borderRadius="lg" mb={6}>
            <AlertIcon />
            <Box>
              <AlertTitle>No products found</AlertTitle>
              <AlertDescription>
                {filter ? 'Try changing your search terms' : 'Add your first product to get started'}
              </AlertDescription>
            </Box>
          </Alert>
        ) : viewMode === 'grid' ? (
          // Grid View
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
            {filteredProducts.map((product, index) => (
              <ProductCard
                key={product._id || product.id || index}
                product={product}
                onEdit={handleEdit}
                onView={handleView}
                onDelete={handleDelete}
              />
            ))}
          </SimpleGrid>
        ) : (
          // List View
          <Box bg="white" borderRadius="xl" shadow="sm" border="1px solid" borderColor="gray.200" overflowX="auto">
            <Table variant="simple">
              <Thead bg="gray.50">
                <Tr>
                  <Th w="50px" py={4}>
                    <input
                      type="checkbox"
                      checked={selectedItems.length === filteredProducts.length && filteredProducts.length > 0}
                      onChange={selectAllItems}
                      style={{ borderRadius: '4px', cursor: 'pointer' }}
                    />
                  </Th>
                  <Th py={4} fontSize="xs" textTransform="uppercase" letterSpacing="wider">Product</Th>
                  <Th py={4} fontSize="xs" textTransform="uppercase" letterSpacing="wider">Category</Th>
                  <Th py={4} fontSize="xs" textTransform="uppercase" letterSpacing="wider" isNumeric>Price</Th>
                  <Th py={4} fontSize="xs" textTransform="uppercase" letterSpacing="wider" isNumeric>Stock</Th>
                  <Th py={4} fontSize="xs" textTransform="uppercase" letterSpacing="wider" isNumeric>Value</Th>
                  <Th py={4} fontSize="xs" textTransform="uppercase" letterSpacing="wider">Status</Th>
                  <Th py={4} fontSize="xs" textTransform="uppercase" letterSpacing="wider">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredProducts.map((product, index) => (
                  <InventoryRow
                    key={product._id || product.id || index}
                    product={product}
                    isSelected={selectedItems.includes(product._id || product.id)}
                    onToggleSelect={toggleItemSelection}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </Tbody>
            </Table>
          </Box>
        )}

        {/* Add Product Modal */}
        <Modal isOpen={isAddOpen} onClose={onAddClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Add New Product</ModalHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
              <ModalBody>
                <Tabs>
                  <TabList>
                    <Tab>Basic Info</Tab>
                    <Tab>Pricing & Stock</Tab>
                    <Tab>Advanced</Tab>
                  </TabList>
                  <TabPanels>
                    <TabPanel>
                      <VStack spacing={4}>
                        <FormControl isRequired>
                          <FormLabel>Product Name</FormLabel>
                          <Input {...register('name', { required: true })} placeholder="Enter product name" />
                        </FormControl>
                        <FormControl>
                          <FormLabel>Description</FormLabel>
                          <Textarea {...register('description')} placeholder="Enter product description" rows={3} />
                        </FormControl>
                        <FormControl isRequired>
                          <FormLabel>Category</FormLabel>
                          <Input
                            list="category-suggestions"
                            {...register('category', { required: true })}
                            placeholder="Select or type a category"
                          />
                          <datalist id="category-suggestions">
                            {categories.filter(c => c !== 'all').map((cat, index) => (
                              <option key={index} value={cat} />
                            ))}
                          </datalist>
                        </FormControl>
                        <FormControl>
                          <FormLabel>SKU (Auto-generated if empty)</FormLabel>
                          <Input {...register('sku')} placeholder="e.g., PROD-001" />
                        </FormControl>
                        <FormControl>
                          <FormLabel>Product Image</FormLabel>
                          <VStack align="start" spacing={2}>
                            <Input
                              type="file"
                              accept="image/*"
                              p={1}
                              {...register('imageFile', { onChange: handleImageUpload })}
                            />
                            <Text fontSize="xs" color="gray.500">Or enter image URL below:</Text>
                            <Input {...register('image')} placeholder="https://example.com/image.jpg" />
                            {watchedImage && (
                              <Box mt={2}>
                                <Image
                                  src={watchedImage}
                                  alt="Preview"
                                  boxSize="100px"
                                  objectFit="cover"
                                  borderRadius="md"
                                  border="1px solid"
                                  borderColor="gray.200"
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                              </Box>
                            )}
                          </VStack>
                        </FormControl>
                      </VStack>
                    </TabPanel>
                    <TabPanel>
                      <VStack spacing={4}>
                        <FormControl isRequired>
                          <FormLabel>Selling Price (₹)</FormLabel>
                          <NumberInput min={0} defaultValue={0}>
                            <NumberInputField {...register('price', { required: true, min: 0 })} placeholder="0.00" />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                        </FormControl>
                        <FormControl>
                          <FormLabel>Cost Price (₹)</FormLabel>
                          <NumberInput min={0} defaultValue={0}>
                            <NumberInputField {...register('cost')} placeholder="0.00" />
                          </NumberInput>
                        </FormControl>
                        <FormControl isRequired>
                          <FormLabel>Initial Stock</FormLabel>
                          <NumberInput min={0} defaultValue={0}>
                            <NumberInputField {...register('stock', { required: true, min: 0 })} placeholder="0" />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                        </FormControl>
                        <FormControl>
                          <FormLabel>Low Stock Threshold</FormLabel>
                          <NumberInput min={1} defaultValue={10}>
                            <NumberInputField {...register('lowStockThreshold')} placeholder="10" />
                          </NumberInput>
                        </FormControl>
                      </VStack>
                    </TabPanel>
                    <TabPanel>
                      <VStack spacing={4}>

                        <FormControl>
                          <FormLabel>Barcode</FormLabel>
                          <Input {...register('barcode')} placeholder="Enter barcode number" />
                        </FormControl>

                        {/* [FEATURE #9] Batch / Lot Number */}
                        <FormControl>
                          <FormLabel>
                            <HStack spacing={2}>
                              <Hash size={14} />
                              <Text>Batch / Lot Number</Text>
                            </HStack>
                          </FormLabel>
                          <Input
                            {...register('batchNumber')}
                            placeholder="e.g. BATCH-2024-001"
                          />
                        </FormControl>

                        {/* [FEATURE #8] Expiry Date */}
                        <FormControl>
                          <FormLabel>
                            <HStack spacing={2}>
                              <AlertTriangle size={14} />
                              <Text>Expiry Date</Text>
                            </HStack>
                          </FormLabel>
                          <Input
                            type="date"
                            {...register('expiryDate')}
                          />
                          <Text fontSize="xs" color="gray.400" mt={1}>
                            Leave blank if the product does not expire.
                          </Text>
                        </FormControl>

                        <FormControl>
                          <Flex align="center" justify="space-between">
                            <FormLabel mb={0}>Track Inventory</FormLabel>
                            <Switch defaultChecked colorScheme="brand" {...register('trackInventory')} />
                          </Flex>
                        </FormControl>
                        <FormControl>
                          <Flex align="center" justify="space-between">
                            <FormLabel mb={0}>Notify on Low Stock</FormLabel>
                            <Switch defaultChecked colorScheme="brand" {...register('notifyLowStock')} />
                          </Flex>
                        </FormControl>
                      </VStack>
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              </ModalBody>
              <ModalFooter flexDirection={{ base: 'column', sm: 'row' }} gap={3}>
                <Button variant="ghost" onClick={onAddClose} w={{ base: 'full', sm: 'auto' }}>
                  Cancel
                </Button>
                <Button colorScheme="brand" type="submit" w={{ base: 'full', sm: 'auto' }}>
                  Add Product
                </Button>
              </ModalFooter>
            </form>
          </ModalContent>
        </Modal>

        {/* Edit Product Modal */}
        <Modal isOpen={isEditOpen} onClose={onEditClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Edit Product</ModalHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
              <ModalBody>
                <Tabs>
                  <TabList>
                    <Tab>Basic Info</Tab>
                    <Tab>Pricing & Stock</Tab>
                    <Tab>Advanced</Tab>
                  </TabList>
                  <TabPanels>
                    <TabPanel>
                      <VStack spacing={4}>
                        <FormControl isRequired>
                          <FormLabel>Product Name</FormLabel>
                          <Input {...register('name', { required: true })} placeholder="Enter product name" />
                        </FormControl>
                        <FormControl>
                          <FormLabel>Description</FormLabel>
                          <Textarea {...register('description')} placeholder="Enter product description" rows={3} />
                        </FormControl>
                        <FormControl isRequired>
                          <FormLabel>Category</FormLabel>
                          <Input
                            list="category-suggestions-edit"
                            {...register('category', { required: true })}
                            placeholder="Select or type a category"
                          />
                          <datalist id="category-suggestions-edit">
                            {categories.filter(c => c !== 'all').map((cat, index) => (
                              <option key={index} value={cat} />
                            ))}
                          </datalist>
                        </FormControl>
                        <FormControl>
                          <FormLabel>SKU</FormLabel>
                          <Input {...register('sku')} placeholder="e.g., PROD-001" />
                        </FormControl>
                        <FormControl>
                          <FormLabel>Product Image</FormLabel>
                          <VStack align="start" spacing={2}>
                            <Input
                              type="file"
                              accept="image/*"
                              p={1}
                              {...register('imageFile', { onChange: handleImageUpload })}
                            />
                            <Text fontSize="xs" color="gray.500">Or enter image URL below:</Text>
                            <Input {...register('image')} placeholder="https://example.com/image.jpg" />
                            {watchedImage && (
                              <Box mt={2}>
                                <Image
                                  src={watchedImage}
                                  alt="Preview"
                                  boxSize="100px"
                                  objectFit="cover"
                                  borderRadius="md"
                                  border="1px solid"
                                  borderColor="gray.200"
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                              </Box>
                            )}
                          </VStack>
                        </FormControl>
                      </VStack>
                    </TabPanel>
                    <TabPanel>
                      <VStack spacing={4}>
                        <FormControl isRequired>
                          <FormLabel>Selling Price (₹)</FormLabel>
                          <NumberInput min={0}>
                            <NumberInputField {...register('price', { required: true, min: 0 })} placeholder="0.00" />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                        </FormControl>
                        <FormControl>
                          <FormLabel>Cost Price (₹)</FormLabel>
                          <NumberInput min={0}>
                            <NumberInputField {...register('cost')} placeholder="0.00" />
                          </NumberInput>
                        </FormControl>
                        <FormControl isRequired>
                          <FormLabel>Stock</FormLabel>
                          <NumberInput min={0}>
                            <NumberInputField {...register('stock', { required: true, min: 0 })} placeholder="0" />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                        </FormControl>
                        <FormControl>
                          <FormLabel>Low Stock Threshold</FormLabel>
                          <NumberInput min={1}>
                            <NumberInputField {...register('lowStockThreshold')} placeholder="10" />
                          </NumberInput>
                        </FormControl>
                      </VStack>
                    </TabPanel>
                    <TabPanel>
                      <VStack spacing={4}>

                        <FormControl>
                          <FormLabel>Barcode</FormLabel>
                          <Input {...register('barcode')} placeholder="Enter barcode number" />
                        </FormControl>

                        {/* [FEATURE #9] Batch / Lot Number */}
                        <FormControl>
                          <FormLabel>
                            <HStack spacing={2}>
                              <Hash size={14} />
                              <Text>Batch / Lot Number</Text>
                            </HStack>
                          </FormLabel>
                          <Input
                            {...register('batchNumber')}
                            placeholder="e.g. BATCH-2024-001"
                          />
                        </FormControl>

                        {/* [FEATURE #8] Expiry Date */}
                        <FormControl>
                          <FormLabel>
                            <HStack spacing={2}>
                              <AlertTriangle size={14} />
                              <Text>Expiry Date</Text>
                            </HStack>
                          </FormLabel>
                          <Input
                            type="date"
                            {...register('expiryDate')}
                          />
                          <Text fontSize="xs" color="gray.400" mt={1}>
                            Leave blank if the product does not expire.
                          </Text>
                        </FormControl>

                        <FormControl>
                          <Flex align="center" justify="space-between">
                            <FormLabel mb={0}>Track Inventory</FormLabel>
                            <Switch colorScheme="brand" {...register('trackInventory')} />
                          </Flex>
                        </FormControl>
                        <FormControl>
                          <Flex align="center" justify="space-between">
                            <FormLabel mb={0}>Notify on Low Stock</FormLabel>
                            <Switch colorScheme="brand" {...register('notifyLowStock')} />
                          </Flex>
                        </FormControl>
                      </VStack>
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              </ModalBody>
              <ModalFooter flexDirection={{ base: 'column', sm: 'row' }} gap={3}>
                <Button variant="ghost" onClick={onEditClose} w={{ base: 'full', sm: 'auto' }}>
                  Cancel
                </Button>
                <Button colorScheme="brand" type="submit" w={{ base: 'full', sm: 'auto' }}>
                  Update Product
                </Button>
              </ModalFooter>
            </form>
          </ModalContent>
        </Modal>

        {/* View Product Drawer */}
        <Drawer isOpen={isViewOpen} placement="right" onClose={onViewClose} size="md">
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerHeader>Product Details</DrawerHeader>
            <DrawerBody>
              {selectedProduct && (
                <VStack spacing={6} align="stretch">
                  <Box h="250px" w="100%" borderRadius="lg" overflow="hidden" bg="gray.100">
                    {selectedImgError ? (
                      <Center w="100%" h="100%">
                        <VStack>
                          <Package size={48} color="#CBD5E0" />
                          <Text color="gray.500" fontWeight="bold">No Image Available</Text>
                        </VStack>
                      </Center>
                    ) : (
                      <Image
                        src={selectedProduct.image}
                        alt={selectedProduct.name}
                        w="100%"
                        h="100%"
                        objectFit="cover"
                        onError={() => setSelectedImgError(true)}
                        key={selectedProduct._id || selectedProduct.id} // Force re-render on product change
                      />
                    )}
                  </Box>
                  <Box>
                    <Heading size="md" mb={2}>{selectedProduct.name || 'Unnamed Product'}</Heading>
                    <Text color="gray.500">{selectedProduct.description || 'No description available'}</Text>
                  </Box>
                  <SimpleGrid columns={2} spacing={4}>
                    <Box>
                      <Text fontSize="sm" color="gray.500">SKU</Text>
                      <Text fontWeight="medium">{selectedProduct.sku || 'N/A'}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.500">Category</Text>
                      <Badge colorScheme="blue">{selectedProduct.category || 'Uncategorized'}</Badge>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.500">Price</Text>
                      <Text fontWeight="bold" color="brand.600">₹{(selectedProduct.price || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.500">Cost Price</Text>
                      <Text fontWeight="bold" color="gray.700">₹{(selectedProduct.cost || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.500">Stock</Text>
                      <Text fontWeight="bold">{selectedProduct.stock || 0} units</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.500">Stock Value</Text>
                      <Text fontWeight="bold" color="green.600">
                        ₹{((selectedProduct.price || 0) * (selectedProduct.stock || 0)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.500">Status</Text>
                      <Badge
                        colorScheme={
                          (selectedProduct.stock || 0) === 0 ? 'red' :
                            (selectedProduct.stock || 0) <= (selectedProduct.lowStockThreshold || 10) ? 'orange' : 'green'
                        }
                      >
                        {(selectedProduct.stock || 0) === 0 ? 'Out of Stock' :
                          (selectedProduct.stock || 0) <= (selectedProduct.lowStockThreshold || 10) ? 'Low Stock' : 'In Stock'}
                      </Badge>
                    </Box>
                  </SimpleGrid>
                  {selectedProduct.createdAt && (
                    <Box>
                      <Text fontSize="sm" color="gray.500">Added On</Text>
                      <Text>{new Date(selectedProduct.createdAt).toLocaleDateString()}</Text>
                    </Box>
                  )}
                  <Button
                    leftIcon={<Edit size={16} />}
                    colorScheme="brand"
                    onClick={() => {
                      onViewClose();
                      handleEdit(selectedProduct);
                    }}
                  >
                    Edit Product
                  </Button>
                </VStack>
              )}
            </DrawerBody>
          </DrawerContent>
        </Drawer>

        {/* Bulk Actions Modal */}
        <Modal isOpen={isBulkOpen} onClose={onBulkClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Bulk Actions ({selectedItems.length} items)</ModalHeader>
            <ModalBody>
              <VStack spacing={4}>
                <Select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  placeholder="Select action"
                >
                  <option value="delete">Delete Selected</option>
                  <option value="restock">Restock All</option>
                  <option value="update_price">Update Price</option>
                  <option value="export">Export to CSV</option>
                  <option value="print_labels">Print Labels</option>
                </Select>
              </VStack>
            </ModalBody>
            <ModalFooter flexDirection={{ base: 'column', sm: 'row' }} gap={3}>
              <Button variant="ghost" onClick={onBulkClose} w={{ base: 'full', sm: 'auto' }}>
                Cancel
              </Button>
              <Button colorScheme="blue" onClick={handleBulkAction} w={{ base: 'full', sm: 'auto' }}>
                Apply Action
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </ScaleFade>
  );
}
