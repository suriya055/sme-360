import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Box, Heading, Table, Thead, Tbody, Tr, Th, Td,
  Badge, Button, Flex, Avatar, Text, useDisclosure,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
  FormControl, FormLabel, Input, Select, Card, CardBody,
  InputGroup, InputLeftElement, InputRightElement, Menu, MenuButton,
  MenuList, MenuItem, IconButton, Stack, HStack, VStack,
  Progress, Stat, StatLabel, StatNumber,
  StatHelpText, Divider, useToast, Tooltip,
  Tabs, TabList, TabPanels, Tab, TabPanel,
  useColorModeValue, Spinner, Alert, AlertIcon, AlertDescription,
  Drawer, DrawerBody, DrawerHeader, DrawerOverlay, DrawerContent,
  DrawerCloseButton, TableContainer, Checkbox,
  Switch, Textarea, SimpleGrid,
  Popover, PopoverTrigger, PopoverContent, PopoverHeader,
  PopoverBody, PopoverArrow, PopoverCloseButton,
  Progress as ChakraProgress, AlertTitle, Code, UnorderedList, ListItem,
  ScaleFade, SlideFade
} from '@chakra-ui/react';
import {
  Plus, Search, Filter, Edit, Trash2, Eye, MoreVertical,
  Phone, Mail, MapPin, Calendar, Award, TrendingUp,
  UserPlus, Download, Upload, Star, CreditCard,
  ShoppingBag, ChevronDown, UserCheck,
  MessageSquare, Crown, Users,
  DollarSign, Hash, Grid as GridIcon,
  List, X, FileText, CheckCircle, AlertCircle, FileUp
} from 'lucide-react';
import { useApp } from '../hooks/useApp';
import { useForm } from 'react-hook-form';

export default function Customers() {
  const { customers, addCustomer, updateCustomer, deleteCustomer, addCustomersBulk, sales, hasPermission } = useApp();
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTier, setSelectedTier] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'totalSpent', direction: 'desc' });
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [isLoading, setIsLoading] = useState(false);
  const [customerStats, setCustomerStats] = useState(null);

  // CSV Import states
  const [csvData, setCsvData] = useState([]);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState('idle'); // 'idle', 'parsing', 'mapping', 'importing', 'complete', 'error'
  const [importMapping, setImportMapping] = useState({});
  const fileInputRef = useRef(null);

  // Modals
  const { isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
  const { isOpen: isImportOpen, onOpen: onImportOpen, onClose: onImportClose } = useDisclosure();

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [activeTab, setActiveTab] = useState('all');

  const { register, handleSubmit, reset } = useForm();

  // Format date helper function
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate days difference helper
  const getDaysDifference = (dateString) => {
    if (!dateString) return 0;
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Calculate customer statistics
  useEffect(() => {
    if (customers.length > 0) {
      const stats = {
        total: customers.length,
        totalSpent: customers.reduce((sum, c) => sum + c.totalSpent, 0),
        avgSpent: customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length,
        byTier: {
          Platinum: customers.filter(c => c.tier === 'Platinum').length,
          Gold: customers.filter(c => c.tier === 'Gold').length,
          Silver: customers.filter(c => c.tier === 'Silver').length,
          Regular: customers.filter(c => c.tier === 'Regular').length
        },
        newThisMonth: customers.filter(c => {
          const daysSinceJoin = getDaysDifference(c.joinDate);
          return daysSinceJoin <= 30;
        }).length,
        topSpender: customers.reduce((max, c) => c.totalSpent > max.totalSpent ? c : max, customers[0])
      };
      setCustomerStats(stats);
    }
  }, [customers]);

  // Filter and sort customers
  useEffect(() => {
    let result = [...customers];

    // Apply search filter
    if (searchTerm) {
      result = result.filter(customer => {
        const lowerSearch = searchTerm.toLowerCase();
        const name = customer.name?.toLowerCase() || '';
        const email = customer.email?.toLowerCase() || '';
        const phone = customer.phone?.toString() || '';

        return name.includes(lowerSearch) ||
          email.includes(lowerSearch) ||
          phone.includes(lowerSearch);
      });
    }

    // Apply tier filter
    if (selectedTier !== 'all') {
      result = result.filter(customer => customer.tier === selectedTier);
    }

    // Apply tab filter
    if (activeTab === 'recent') {
      result = result.filter(customer => {
        const daysSinceJoin = getDaysDifference(customer.joinDate);
        return daysSinceJoin <= 7;
      });
    } else if (activeTab === 'active') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      result = result.filter(customer => {
        const customerSales = sales.filter(s => s.customerId === (customer._id || customer.id));
        const recentSales = customerSales.filter(s => {
          const saleDate = new Date(s.date);
          return saleDate > thirtyDaysAgo;
        });
        return recentSales.length > 0;
      });
    } else if (activeTab === 'inactive') {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setDate(threeMonthsAgo.getDate() - 90);
      result = result.filter(customer => {
        const customerSales = sales.filter(s => s.customerId === (customer._id || customer.id));
        const recentSales = customerSales.filter(s => {
          const saleDate = new Date(s.date);
          return saleDate > threeMonthsAgo;
        });
        return recentSales.length === 0;
      });
    }

    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredCustomers(result);
  }, [customers, searchTerm, selectedTier, sortConfig, activeTab, sales]);

  // CSV Import Functions
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file",
        status: "error",
        duration: 3000,
      });
      return;
    }

    setImportStatus('parsing');

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        parseCSV(text);
      } catch (error) {
        console.error('Error parsing CSV:', error);
        toast({
          title: "Error parsing CSV",
          description: error.message,
          status: "error",
          duration: 3000,
        });
        setImportStatus('error');
      }
    };
    reader.readAsText(file);
  };

  const parseCSV = (csvText) => {
    const lines = csvText.split('\n').filter(line => line.trim() !== '');

    if (lines.length < 2) {
      throw new Error('CSV file must contain at least one header row and one data row');
    }

    // Parse headers
    const headers = lines[0].split(',').map(header =>
      header.trim().replace(/"/g, '')
    );

    // Parse data rows
    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i];
      const values = [];
      let currentValue = '';
      let insideQuotes = false;

      // Handle CSV with quotes and commas
      for (let j = 0; j < row.length; j++) {
        const char = row[j];
        const nextChar = row[j + 1];

        if (char === '"') {
          if (insideQuotes && nextChar === '"') {
            currentValue += '"';
            j++; // Skip next quote
          } else {
            insideQuotes = !insideQuotes;
          }
        } else if (char === ',' && !insideQuotes) {
          values.push(currentValue.trim());
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      values.push(currentValue.trim());

      // Create object from row
      const rowObject = {};
      headers.forEach((header, index) => {
        rowObject[header] = values[index] || '';
      });

      data.push(rowObject);
    }

    setCsvHeaders(headers);
    setCsvData(data);
    setImportStatus('mapping');

    // Auto-map common headers
    const autoMapping = {};
    headers.forEach(header => {
      const lowerHeader = header.toLowerCase();
      if (lowerHeader.includes('name')) autoMapping[header] = 'name';
      else if (lowerHeader.includes('email')) autoMapping[header] = 'email';
      else if (lowerHeader.includes('phone')) autoMapping[header] = 'phone';
      else if (lowerHeader.includes('address')) autoMapping[header] = 'address';
      else if (lowerHeader.includes('city')) autoMapping[header] = 'city';
      else if (lowerHeader.includes('state')) autoMapping[header] = 'state';
      else if (lowerHeader.includes('zip') || lowerHeader.includes('postal')) autoMapping[header] = 'zipCode';
      else if (lowerHeader.includes('date') && lowerHeader.includes('birth')) autoMapping[header] = 'dateOfBirth';
      else if (lowerHeader.includes('notes')) autoMapping[header] = 'notes';
      else if (lowerHeader.includes('tags')) autoMapping[header] = 'tags';
      else if (lowerHeader.includes('lang')) autoMapping[header] = 'preferredLanguage';
    });

    setImportMapping(autoMapping);
  };

  const handleImport = async () => {
    if (csvData.length === 0) {
      toast({
        title: "No data to import",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    setImportStatus('importing');
    setImportProgress(10);

    const totalRows = csvData.length;
    let skippedCount = 0;
    const errors = [];
    const customersToImport = [];

    // First pass: Validate and Prepare
    const invertedMapping = {};
    Object.keys(importMapping).forEach(header => {
      const field = importMapping[header];
      if (field) invertedMapping[field] = header;
    });

    const normalizeLang = (v) => {
      const s = String(v || '').trim().toLowerCase();
      if (s === 'ta' || s === 'tamil' || s === 'தமிழ்') return 'ta';
      if (s === 'hi' || s === 'hindi' || s === 'हिंदी') return 'hi';
      if (s === 'en' || s === 'english') return 'en';
      return 'en';
    };

    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];

      try {
        // Map CSV row to customer object
        const customerData = {
          name: row[invertedMapping.name] || 'Unknown Customer',
          email: row[invertedMapping.email] || '',
          phone: row[invertedMapping.phone] || '',
          preferredLanguage: invertedMapping.preferredLanguage ? normalizeLang(row[invertedMapping.preferredLanguage]) : 'en',
          address: row[invertedMapping.address] || '',
          city: row[invertedMapping.city] || '',
          state: row[invertedMapping.state] || '',
          zipCode: row[invertedMapping.zipCode] || '',
          dateOfBirth: row[invertedMapping.dateOfBirth] || '',
          notes: row[invertedMapping.notes] || '',
          tags: row[invertedMapping.tags] ? row[invertedMapping.tags].split(',').map(tag => tag.trim()) : [],
          totalSpent: 0,
          tier: 'Regular',
          joinDate: new Date().toISOString(),
          preferences: {
            smsNotifications: false,
            emailNewsletter: true
          }
        };

        // Validate required fields
        if (!customerData.name || !customerData.email) {
          skippedCount++;
          errors.push(`Row ${i + 2}: Missing required fields (name or email)`);
          continue;
        }

        // Check for duplicate email locally
        const existingCustomer = customers.find(c =>
          (c.email || '').toLowerCase() === customerData.email.toLowerCase()
        );

        // Also check in the list we are building
        const duplicateInBatch = customersToImport.find(c =>
          (c.email || '').toLowerCase() === customerData.email.toLowerCase()
        );

        if (existingCustomer || duplicateInBatch) {
          skippedCount++;
          errors.push(`Row ${i + 2}: Customer with email ${customerData.email} already exists`);
          continue;
        }

        customersToImport.push(customerData);

      } catch (error) {
        skippedCount++;
        errors.push(`Row ${i + 2}: ${error.message}`);
      }
    }

    setImportProgress(40);

    // Second pass: Bulk Import
    let importedCount = 0;
    if (customersToImport.length > 0) {
      try {
        await addCustomersBulk(customersToImport);
        importedCount = customersToImport.length;
        setImportProgress(100);
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Failed to save customers",
          status: "error",
          duration: 5000
        });
        setImportStatus('error');
        return;
      }
    } else {
      setImportProgress(100);
    }

    setImportStatus('complete');

    // Show import summary
    toast({
      title: "Import Complete",
      description: (
        <Box>
          <Text>Imported: {importedCount} customers</Text>
          <Text>Skipped: {skippedCount} rows</Text>
          {errors.length > 0 && (
            <Text color="orange.500" mt={2}>
              {errors.length} errors occurred
            </Text>
          )}
        </Box>
      ),
      status: importedCount > 0 ? "success" : "warning",
      duration: 5000,
      isClosable: true,
    });

    // Reset after 3 seconds
    setTimeout(() => {
      setCsvData([]);
      setCsvHeaders([]);
      setImportMapping({});
      setImportProgress(0);
      setImportStatus('idle');
      onImportClose();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }, 3000);
  };

  const resetImport = () => {
    setCsvData([]);
    setCsvHeaders([]);
    setImportMapping({});
    setImportProgress(0);
    setImportStatus('idle');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'Platinum': return { bg: 'purple.100', color: 'purple.700', icon: Crown };
      case 'Gold': return { bg: 'yellow.100', color: 'yellow.700', icon: Award };
      case 'Silver': return { bg: 'gray.100', color: 'gray.700', icon: Star };
      default: return { bg: 'blue.100', color: 'blue.700', icon: UserCheck };
    }
  };

  const getSpentRangeColor = (amount) => {
    if (amount > 100000) return 'green.500';
    if (amount > 50000) return 'green.400';
    if (amount > 10000) return 'green.300';
    if (amount > 5000) return 'green.200';
    return 'green.100';
  };

  const handleViewCustomer = (customer) => {
    setSelectedCustomer(customer);
    onViewOpen();
  };

  const handleEditCustomer = (customer) => {
    setSelectedCustomer(customer);
    reset(customer);
    onEditOpen();
  };

  const handleDeleteCustomer = (customerId) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      deleteCustomer(customerId);
      toast({
        title: "Customer deleted",
        status: "success",
        duration: 2000,
      });
    }
  };

  const onSubmitAdd = (data) => {
    const normalizeLang = (v) => {
      const s = String(v || '').trim().toLowerCase();
      if (s === 'ta' || s === 'tamil' || s === 'தமிழ்') return 'ta';
      if (s === 'hi' || s === 'hindi' || s === 'हिंदी') return 'hi';
      return 'en';
    };
    const customerData = {
      ...data,
      preferredLanguage: normalizeLang(data.preferredLanguage),
      totalSpent: 0,
      tier: 'Regular',
      joinDate: new Date().toISOString(),
      tags: data.tags ? data.tags.split(',').map(tag => tag.trim()) : [],
      preferences: {
        smsNotifications: data.smsNotifications || false,
        emailNewsletter: data.emailNewsletter || true
      }
    };

    addCustomer(customerData);
    toast({
      title: "Customer added successfully!",
      status: "success",
      duration: 2000,
    });
    reset();
    onAddClose();
  };

  const onSubmitEdit = (data) => {
    if (selectedCustomer) {
      const normalizeLang = (v) => {
        const s = String(v || '').trim().toLowerCase();
        if (s === 'ta' || s === 'tamil' || s === 'தமிழ்') return 'ta';
        if (s === 'hi' || s === 'hindi' || s === 'हिंदी') return 'hi';
        return 'en';
      };
      updateCustomer(selectedCustomer._id || selectedCustomer.id, { ...data, preferredLanguage: normalizeLang(data.preferredLanguage) });
      toast({
        title: "Customer updated successfully!",
        status: "success",
        duration: 2000,
      });
      onEditClose();
    }
  };

  const exportToExcel = () => {
    // Simple export functionality
    const csvContent = filteredCustomers.map(c => ({
      Name: c.name,
      Email: c.email,
      Phone: c.phone,
      Tier: c.tier,
      'Total Spent': c.totalSpent,
      'Join Date': formatDate(c.joinDate),
      'Last Purchase': c.lastPurchase ? formatDate(c.lastPurchase) : 'Never',
      Address: c.address || '',
      City: c.city || '',
      State: c.state || '',
      'Zip Code': c.zipCode || ''
    }));

    // Create CSV string
    const headers = Object.keys(csvContent[0]).join(',');
    const rows = csvContent.map(row => Object.values(row).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;

    // Create download link
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    toast({
      title: "Export started",
      description: "Customer data exported as CSV",
      status: "success",
      duration: 3000,
    });
  };

  const handleBulkAction = (action) => {
    if (selectedCustomers.length === 0) {
      toast({
        title: "No customers selected",
        status: "error",
        duration: 2000,
      });
      return;
    }

    switch (action) {
      case 'export':
        exportToExcel();
        break;
      case 'sendEmail':
        toast({
          title: `Email sent to ${selectedCustomers.length} customers`,
          status: "success",
          duration: 2000,
        });
        break;
      case 'addTag':
        toast({
          title: "Tag added to selected customers",
          status: "success",
          duration: 2000,
        });
        break;
      default:
        break;
    }

    setSelectedCustomers([]);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedCustomers(filteredCustomers.map(c => c._id || c.id));
    } else {
      setSelectedCustomers([]);
    }
  };

  const handleSelectCustomer = (customerId) => {
    setSelectedCustomers(prev =>
      prev.includes(customerId)
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const renderCustomerCard = (customer) => {
    const tierStyle = getTierColor(customer.tier);
    const IconComponent = tierStyle.icon;

    const customerSales = sales.filter(s => s.customerId === (customer._id || customer.id));
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentSales = customerSales.filter(s => {
      const saleDate = new Date(s.date);
      return saleDate > thirtyDaysAgo;
    }).length;

    return (
      <Card
        key={customer._id || customer.id}
        borderRadius="xl"
        border="1px solid"
        borderColor="gray.200"
        shadow="sm"
        _hover={{ shadow: 'md', borderColor: 'brand.300', transform: 'translateY(-2px)' }}
        transition="all 0.2s"
        overflow="hidden"
      >
        <CardBody p={5}>
          <Flex justify="space-between" align="start" mb={4}>
            <Flex align="center" gap={3}>
              <Avatar
                size="md"
                name={customer.name}
                bg={tierStyle.bg}
                color={tierStyle.color}
                border="2px solid"
                borderColor={tierStyle.color}
              />
              <Box>
                <Heading size="sm" mb={1} color="gray.800">{customer.name}</Heading>
                <Badge
                  bg={tierStyle.bg}
                  color={tierStyle.color}
                  px={2}
                  py={0.5}
                  borderRadius="full"
                  fontSize="xs"
                  display="inline-flex"
                  alignItems="center"
                  gap={1}
                >
                  <IconComponent size={10} />
                  {customer.tier}
                </Badge>
              </Box>
            </Flex>

            <Menu>
              <MenuButton
                as={IconButton}
                icon={<MoreVertical size={16} />}
                size="sm"
                variant="ghost"
                borderRadius="full"
              />
              <MenuList fontSize="sm" minW="150px">
                <MenuItem icon={<Eye size={14} />} onClick={() => handleViewCustomer(customer)}>
                  View Details
                </MenuItem>
                {hasPermission('canManageCustomers') && (
                  <MenuItem icon={<Edit size={14} />} onClick={() => handleEditCustomer(customer)}>
                    Edit
                  </MenuItem>
                )}
                {(hasPermission('canManageCustomers') || hasPermission('canDeleteRecords')) && (
                  <MenuItem icon={<Trash2 size={14} />} onClick={() => handleDeleteCustomer(customer._id || customer.id)} color="red.500">
                    Delete
                  </MenuItem>
                )}
              </MenuList>
            </Menu>
          </Flex>

          <VStack align="stretch" spacing={2} mb={5}>
            <Flex align="center" gap={3} color="gray.500" fontSize="sm">
              <Mail size={14} />
              <Text isTruncated>{customer.email}</Text>
            </Flex>

            <Flex align="center" gap={3} color="gray.500" fontSize="sm">
              <Phone size={14} />
              <Text>{customer.phone}</Text>
            </Flex>

            <Flex align="center" gap={3} color="gray.500" fontSize="sm">
              <Calendar size={14} />
              <Text>Joined {formatDate(customer.joinDate)}</Text>
            </Flex>
          </VStack>

          <Divider mb={4} borderColor="gray.100" />

          <SimpleGrid columns={2} spacing={4}>
            <Box>
              <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="wide">Total Spent</Text>
              <Text fontWeight="700" color="gray.800">
                ₹{(customer.totalSpent || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </Text>
            </Box>
            <Box>
              <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="wide">Orders</Text>
              <Text fontWeight="700" color="gray.800">{recentSales}</Text>
            </Box>
          </SimpleGrid>

          <Box mt={4}>
            <Tooltip label={`₹${(100000 - (customer.totalSpent || 0)).toLocaleString('en-IN', { maximumFractionDigits: 0 })} to next tier`} placement="top">
              <Progress
                value={((customer.totalSpent || 0) / 100000) * 100}
                max={100}
                size="xs"
                borderRadius="full"
                colorScheme={customer.tier === 'Platinum' ? 'purple' : customer.tier === 'Gold' ? 'yellow' : 'blue'}
                bg="gray.100"
              />
            </Tooltip>
          </Box>
        </CardBody>
      </Card>
    );
  };

  // CSV Import Modal Content
  const renderImportModal = () => (
    <Modal isOpen={isImportOpen} onClose={onImportClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Flex align="center" gap={2}>
            <FileUp size={20} />
            Import Customers from CSV
          </Flex>
        </ModalHeader>
        <ModalBody>
          {importStatus === 'idle' && (
            <VStack spacing={6} align="stretch">
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <Box>
                  <AlertTitle>CSV Format Requirements</AlertTitle>
                  <UnorderedList mt={2} fontSize="sm">
                    <ListItem>File must be in CSV format (.csv)</ListItem>
                    <ListItem>First row must contain column headers</ListItem>
                    <ListItem>Required columns: <Code>Name</Code> and <Code>Email</Code></ListItem>
                    <ListItem>Optional columns: Phone, Address, City, State, ZipCode, DateOfBirth, Notes, Tags</ListItem>
                    <ListItem>Date format: YYYY-MM-DD (e.g., 1990-01-15)</ListItem>
                  </UnorderedList>
                </Box>
              </Alert>

              <Box
                border="2px dashed"
                borderColor="gray.300"
                borderRadius="lg"
                p={8}
                textAlign="center"
                cursor="pointer"
                _hover={{ borderColor: 'brand.500', bg: 'brand.50' }}
                onClick={() => fileInputRef.current?.click()}
              >
                <FileText size={48} color="#CBD5E0" />
                <Text mt={4} fontWeight="medium">Click to upload CSV file</Text>
                <Text fontSize="sm" color="gray.500" mt={2}>
                  or drag and drop your file here
                </Text>
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  ref={fileInputRef}
                  display="none"
                />
              </Box>

              <Box p={4} bg="gray.50" borderRadius="md">
                <Text fontSize="sm" fontWeight="medium" mb={2}>Sample CSV Format:</Text>
                <Code fontSize="xs" p={2} display="block" whiteSpace="pre" overflowX="auto">
                  Name,Email,Phone,Address,City,State,ZipCode,DateOfBirth,Notes,Tags{'\n'}
                  John Doe,john@example.com,+91 9876543210,123 Main St,Mumbai,Maharashtra,400001,1990-01-15,"Regular customer",VIP{'\n'}
                  Jane Smith,jane@example.com,+91 9876543211,456 Oak Ave,Delhi,Delhi,110001,1985-05-20,,"Corporate,Wholesale"
                </Code>
              </Box>
            </VStack>
          )}

          {importStatus === 'parsing' && (
            <VStack spacing={6} align="center" py={8}>
              <Spinner size="xl" color="brand.500" />
              <Text fontSize="lg" fontWeight="medium">Parsing CSV file...</Text>
            </VStack>
          )}

          {importStatus === 'mapping' && (
            <VStack spacing={6} align="stretch">
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <Box>
                  <AlertTitle>CSV Preview</AlertTitle>
                  <Text fontSize="sm" mt={1}>
                    Detected {csvData.length} rows and {csvHeaders.length} columns
                  </Text>
                </Box>
              </Alert>

              <Box maxH="200px" overflowY="auto" border="1px solid" borderColor="gray.200" borderRadius="md">
                <Table size="sm">
                  <Thead bg="gray.50" position="sticky" top={{ base: "56px", md: 0 }}>
                    <Tr>
                      {csvHeaders.map((header, index) => (
                        <Th key={index} fontSize="xs" py={2}>
                          {header}
                        </Th>
                      ))}
                    </Tr>
                  </Thead>
                  <Tbody>
                    {csvData.slice(0, 5).map((row, rowIndex) => (
                      <Tr key={rowIndex}>
                        {csvHeaders.map((header, colIndex) => (
                          <Td key={colIndex} fontSize="xs" py={2}>
                            {row[header] || ''}
                          </Td>
                        ))}
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
              {csvData.length > 5 && (
                <Text fontSize="sm" color="gray.500" textAlign="center">
                  Showing first 5 of {csvData.length} rows
                </Text>
              )}

              <Text fontSize="sm" fontWeight="medium">Map CSV columns to customer fields:</Text>
              <SimpleGrid columns={2} spacing={4}>
                {csvHeaders.map((header, index) => (
                  <FormControl key={index}>
                    <FormLabel fontSize="sm">{header}</FormLabel>
                    <Select
                      value={importMapping[header] || ''}
                      onChange={(e) => setImportMapping(prev => ({
                        ...prev,
                        [header]: e.target.value
                      }))}
                      size="sm"
                    >
                      <option value="">Ignore this column</option>
                      <option value="name">Name</option>
                      <option value="email">Email</option>
                      <option value="phone">Phone</option>
                      <option value="preferredLanguage">Language (en/ta/hi)</option>
                      <option value="address">Address</option>
                      <option value="city">City</option>
                      <option value="state">State</option>
                      <option value="zipCode">Zip Code</option>
                      <option value="dateOfBirth">Date of Birth</option>
                      <option value="notes">Notes</option>
                      <option value="tags">Tags</option>
                    </Select>
                  </FormControl>
                ))}
              </SimpleGrid>

              <Alert status="warning" borderRadius="md">
                <AlertIcon />
                <Text fontSize="sm">
                  <strong>Note:</strong> Name and Email are required fields. Rows without these will be skipped.
                </Text>
              </Alert>
            </VStack>
          )}

          {importStatus === 'importing' && (
            <VStack spacing={6} align="center" py={8}>
              <ChakraProgress value={importProgress} size="lg" colorScheme="brand" width="100%" />
              <Text fontSize="lg" fontWeight="medium">Importing {importProgress}%</Text>
              <Text fontSize="sm" color="gray.500">
                Processing customer records...
              </Text>
            </VStack>
          )}

          {importStatus === 'complete' && (
            <VStack spacing={6} align="center" py={8}>
              <CheckCircle size={64} color="#48BB78" />
              <Text fontSize="lg" fontWeight="medium">Import Complete!</Text>
              <Text fontSize="sm" color="gray.500" textAlign="center">
                Customers have been imported successfully. The window will close automatically.
              </Text>
            </VStack>
          )}

          {importStatus === 'error' && (
            <VStack spacing={6} align="center" py={8}>
              <AlertCircle size={64} color="#F56565" />
              <Text fontSize="lg" fontWeight="medium" color="red.600">Import Failed</Text>
              <Text fontSize="sm" color="gray.500" textAlign="center">
                There was an error processing your CSV file. Please check the format and try again.
              </Text>
            </VStack>
          )}
        </ModalBody>

        <ModalFooter flexDirection={{ base: 'column', sm: 'row' }} gap={3}>
          {importStatus === 'idle' && (
            <>
              <Button variant="ghost" onClick={onImportClose} w={{ base: 'full', sm: 'auto' }}>
                Cancel
              </Button>
            </>
          )}

          {importStatus === 'mapping' && (
            <>
              <Button variant="ghost" onClick={resetImport} w={{ base: 'full', sm: 'auto' }}>
                Start Over
              </Button>
              <Button
                colorScheme="brand"
                onClick={handleImport}
                isDisabled={!Object.values(importMapping).includes('name') || !Object.values(importMapping).includes('email')}
                w={{ base: 'full', sm: 'auto' }}
              >
                Start Import
              </Button>
            </>
          )}

          {(importStatus === 'complete' || importStatus === 'error') && (
            <Button colorScheme="brand" onClick={resetImport} w={{ base: 'full', sm: 'auto' }}>
              Import Another File
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );

  return (
    <ScaleFade in={true} initialScale={0.95}>
      <Box minH="calc(100vh - 80px)">
        {/* Header Section */}
        <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ base: 'stretch', md: 'center' }} mb={8} gap={4}>
          <Box>
            <Heading size="lg" color="gray.800" fontWeight="700" letterSpacing="-0.5px">Customer Management</Heading>
            <Text color="gray.500" mt={1}>
              {customerStats ? `${customerStats.total} active customers • ₹${customerStats.totalSpent.toLocaleString('en-IN', { maximumFractionDigits: 0 })} lifetime revenue` : 'Loading...'}
            </Text>
          </Box>

          <HStack spacing={3} wrap={{ base: 'wrap', sm: 'nowrap' }}>
            {hasPermission('canManageCustomers') && (
              <Button
                leftIcon={<Download size={18} />}
                variant="outline"
                onClick={onImportOpen}
                flex={{ base: '1', sm: 'initial' }}
              >
                Import CSV
              </Button>
            )}
            <Button
              leftIcon={<Upload size={18} />}
              variant="outline"
              onClick={exportToExcel}
              flex={{ base: '1', sm: 'initial' }}
            >
              Export CSV
            </Button>
            {hasPermission('canManageCustomers') && (
              <Button
                leftIcon={<UserPlus size={18} />}
                colorScheme="brand"
                onClick={onAddOpen}
                w={{ base: 'full', sm: 'auto' }}
              >
                Add Customer
              </Button>
            )}
          </HStack>
        </Flex>

        {/* Stats Cards */}
        {customerStats && (
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={4} mb={8}>
            {[
              { label: 'Platinum Members', value: customerStats.byTier.Platinum, icon: Crown, color: 'purple', sub: `${((customerStats.byTier.Platinum / customerStats.total) * 100).toFixed(1)}% of total` },
              { label: 'Gold Members', value: customerStats.byTier.Gold, icon: Award, color: 'yellow', sub: `${((customerStats.byTier.Gold / customerStats.total) * 100).toFixed(1)}% of total` },
              { label: 'Silver Members', value: customerStats.byTier.Silver, icon: Star, color: 'gray', sub: `${((customerStats.byTier.Silver / customerStats.total) * 100).toFixed(1)}% of total` },
              { label: 'New This Month', value: customerStats.newThisMonth, icon: UserPlus, color: 'blue', sub: 'New customers' }
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
                <CardBody>
                  <Flex justify="space-between" align="start">
                    <Box>
                      <Text color="gray.500" fontSize="xs" fontWeight="700" textTransform="uppercase" letterSpacing="wide" mb={1}>
                        {stat.label}
                      </Text>
                      <Heading size="lg" color="gray.800">{stat.value}</Heading>
                      <Text fontSize="xs" color="gray.400" mt={1}>{stat.sub}</Text>
                    </Box>
                    <Flex
                      w="40px"
                      h="40px"
                      align="center"
                      justify="center"
                      bg={`${stat.color}.50`}
                      color={`${stat.color}.500`}
                      borderRadius="lg"
                    >
                      <stat.icon size={20} />
                    </Flex>
                  </Flex>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        )}


        {/* Filters and Controls */}
        <Card mb={6} variant="outline">
          <CardBody p={4}>
            <Flex direction={{ base: 'column', md: 'row' }} gap={4} align={{ md: 'center' }}>
              {/* Search */}
              <InputGroup flex={1}>
                <InputLeftElement pointerEvents="none">
                  <Search size={18} color="gray" />
                </InputLeftElement>
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <InputRightElement>
                    <IconButton
                      icon={<X size={14} />}
                      size="xs"
                      variant="ghost"
                      onClick={() => setSearchTerm('')}
                      aria-label="Clear search"
                    />
                  </InputRightElement>
                )}
              </InputGroup>

              {/* Tier Filter */}
              <Select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value)}
                w={{ base: 'full', md: '200px' }}
              >
                <option value="all">All Tiers</option>
                <option value="Platinum">Platinum</option>
                <option value="Gold">Gold</option>
                <option value="Silver">Silver</option>
                <option value="Regular">Regular</option>
              </Select>

              {/* View Mode Toggle */}
              <HStack>
                <IconButton
                  icon={<GridIcon size={18} />}
                  variant={viewMode === 'grid' ? 'solid' : 'outline'}
                  colorScheme={viewMode === 'grid' ? 'brand' : 'gray'}
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                />
                <IconButton
                  icon={<List size={18} />}
                  variant={viewMode === 'list' ? 'solid' : 'outline'}
                  colorScheme={viewMode === 'list' ? 'brand' : 'gray'}
                  onClick={() => setViewMode('list')}
                  aria-label="List view"
                />
              </HStack>

              {/* Bulk Actions */}
              {selectedCustomers.length > 0 && (
                <HStack spacing={2}>
                  <Popover placement="bottom-end">
                    <PopoverTrigger>
                      <Button leftIcon={<Users size={18} />} colorScheme="blue" w={{ base: 'full', md: 'auto' }}>
                        {selectedCustomers.length} selected
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                      <PopoverArrow />
                      <PopoverCloseButton />
                      <PopoverHeader>Bulk Actions</PopoverHeader>
                      <PopoverBody>
                        <VStack align="stretch">
                          <Button size="sm" leftIcon={<Mail size={14} />} onClick={() => handleBulkAction('sendEmail')}>
                            Send Email
                          </Button>
                          <Button size="sm" leftIcon={<Upload size={14} />} onClick={() => handleBulkAction('export')}>
                            Export Selected
                          </Button>
                          <Button size="sm" leftIcon={<Hash size={14} />} onClick={() => handleBulkAction('addTag')}>
                            Add Tag
                          </Button>
                        </VStack>
                      </PopoverBody>
                    </PopoverContent>
                  </Popover>
                  <Button
                    leftIcon={<X size={18} />}
                    variant="outline"
                    colorScheme="red"
                    onClick={() => setSelectedCustomers([])}
                    w={{ base: 'full', md: 'auto' }}
                  >
                    Clear
                  </Button>
                </HStack>
              )}
            </Flex>

            {/* Tabs */}
            <Tabs
              variant="soft-rounded"
              colorScheme="brand"
              mt={4}
              index={['all', 'recent', 'active', 'inactive'].indexOf(activeTab)}
              onChange={(index) => {
                const tabs = ['all', 'recent', 'active', 'inactive'];
                setActiveTab(tabs[index]);
              }}
            >
              <TabList overflowX="auto" sx={{ '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none' }}>
                <Tab>All Customers</Tab>
                <Tab>Recent</Tab>
                <Tab>Active</Tab>
                <Tab>Inactive</Tab>
              </TabList>
            </Tabs>
          </CardBody>
        </Card>

        {/* Customers Display */}
        {isLoading ? (
          <Flex justify="center" align="center" h="200px">
            <Spinner size="xl" color="brand.500" />
          </Flex>
        ) : filteredCustomers.length === 0 ? (
          <Alert status="info" borderRadius="lg">
            <AlertIcon />
            <AlertDescription>
              No customers found. {searchTerm ? 'Try a different search term.' : 'Add your first customer.'}
            </AlertDescription>
          </Alert>
        ) : viewMode === 'grid' ? (
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
            {filteredCustomers.map(renderCustomerCard)}
          </SimpleGrid>
        ) : (
          <Card borderRadius="xl" border="1px solid" borderColor="gray.100" shadow="sm" overflow="hidden">
            <TableContainer>
              <Table variant="striped">
                <Thead>
                  <Tr>
                    <Th w="50px">
                      <Checkbox
                        isChecked={selectedCustomers.length === filteredCustomers.length}
                        onChange={handleSelectAll}
                      />
                    </Th>
                    <Th>Customer</Th>
                    <Th display={{ base: 'none', md: 'table-cell' }} cursor="pointer" onClick={() => handleSort('tier')}>
                      <Flex align="center" gap={1}>
                        Tier
                        {sortConfig.key === 'tier' && (
                          <ChevronDown size={14} style={{
                            transform: sortConfig.direction === 'desc' ? 'rotate(180deg)' : 'none'
                          }} />
                        )}
                      </Flex>
                    </Th>
                    <Th display={{ base: 'none', md: 'table-cell' }} cursor="pointer" onClick={() => handleSort('totalSpent')}>
                      <Flex align="center" gap={1}>
                        Total Spent
                        {sortConfig.key === 'totalSpent' && (
                          <ChevronDown size={14} style={{
                            transform: sortConfig.direction === 'desc' ? 'rotate(180deg)' : 'none'
                          }} />
                        )}
                      </Flex>
                    </Th>
                    <Th display={{ base: 'none', md: 'table-cell' }} cursor="pointer" onClick={() => handleSort('loyaltyPoints')}>
                      <Flex align="center" gap={1}>
                        Loyalty Points
                        {sortConfig.key === 'loyaltyPoints' && (
                          <ChevronDown size={14} style={{
                            transform: sortConfig.direction === 'desc' ? 'rotate(180deg)' : 'none'
                          }} />
                        )}
                      </Flex>
                    </Th>
                    <Th>Contact</Th>
                    <Th display={{ base: 'none', md: 'table-cell' }}>Join Date</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredCustomers.map(customer => {
                    const tierStyle = getTierColor(customer.tier);
                    return (
                      <Tr key={customer._id || customer.id} _hover={{ bg: 'gray.50' }}>
                        <Td>
                          <Checkbox
                            isChecked={selectedCustomers.includes(customer._id || customer.id)}
                            onChange={() => handleSelectCustomer(customer._id || customer.id)}
                          />
                        </Td>
                        <Td>
                          <Flex align="center" gap={3}>
                            <Avatar size="sm" name={customer.name} />
                            <Box>
                              <Text fontWeight="medium">{customer.name}</Text>
                              <Text fontSize="sm" color="gray.500">ID: {(customer._id || customer.id).slice(0, 8)}</Text>
                              <HStack display={{ base: 'flex', md: 'none' }} mt={2} spacing={2} wrap="wrap">
                                <Badge colorScheme={tierStyle.color.replace('.700', '')} variant="subtle">
                                  {customer.tier}
                                </Badge>
                                <Badge colorScheme="purple" variant="outline" borderRadius="full" px={2}>
                                  {Math.floor(customer.loyaltyPoints || 0)} pts
                                </Badge>
                              </HStack>
                            </Box>
                          </Flex>
                        </Td>
                        <Td display={{ base: 'none', md: 'table-cell' }}>
                          <Badge colorScheme={tierStyle.color.replace('.700', '')} variant="subtle">
                            {customer.tier}
                          </Badge>
                        </Td>
                        <Td display={{ base: 'none', md: 'table-cell' }}>
                          <Text fontWeight="bold" color={getSpentRangeColor(customer.totalSpent)}>
                            ₹{customer.totalSpent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            {customer.totalSpent === 0 ? 'No purchases' : 'Loyal customer'}
                          </Text>
                        </Td>
                        <Td display={{ base: 'none', md: 'table-cell' }}>
                          <Badge colorScheme="purple" variant="solid" borderRadius="full" px={2}>
                            {Math.floor(customer.loyaltyPoints || 0)} pts
                          </Badge>
                        </Td>
                        <Td>
                          <VStack align="start" spacing={0}>
                            <Text fontSize="sm">{customer.email}</Text>
                            <Text fontSize="sm" color="gray.500">{customer.phone}</Text>
                          </VStack>
                        </Td>
                        <Td display={{ base: 'none', md: 'table-cell' }}>
                          <Text fontSize="sm">
                            {formatDate(customer.joinDate)}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            {getDaysDifference(customer.joinDate)} days ago
                          </Text>
                        </Td>
                        <Td>
                          <HStack spacing={2}>
                            <IconButton
                              icon={<Eye size={14} />}
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewCustomer(customer)}
                              aria-label="View customer"
                            />
                            <IconButton
                              icon={<Edit size={14} />}
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditCustomer(customer)}
                              aria-label="Edit customer"
                            />
                            <IconButton
                              icon={<Trash2 size={14} />}
                              size="sm"
                              variant="ghost"
                              colorScheme="red"
                              onClick={() => handleDeleteCustomer(customer._id || customer.id)}
                              aria-label="Delete customer"
                            />
                          </HStack>
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            </TableContainer>
          </Card>
        )}

        {/* Add Customer Modal */}
        <Modal isOpen={isAddOpen} onClose={onAddClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              <Flex align="center" gap={2}>
                <UserPlus size={20} />
                Add New Customer
              </Flex>
            </ModalHeader>
            <form onSubmit={handleSubmit(onSubmitAdd)}>
              <ModalBody>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Full Name</FormLabel>
                    <Input {...register('name', { required: true })} placeholder="John Doe" />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Email</FormLabel>
                    <Input
                      {...register('email', {
                        pattern: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i
                      })}
                      type="email"
                      placeholder="john@example.com (Optional)"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Phone Number</FormLabel>
                    <Input
                      {...register('phone', { required: true })}
                      placeholder="+91 98765 43210"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Preferred WhatsApp Language</FormLabel>
                    <Select {...register('preferredLanguage')} defaultValue="en">
                      <option value="en">English</option>
                      <option value="ta">Tamil</option>
                      <option value="hi">Hindi</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Date of Birth</FormLabel>
                    <Input
                      {...register('dateOfBirth')}
                      type="date"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Address</FormLabel>
                    <Textarea
                      {...register('address')}
                      placeholder="123 Main Street, City, State, ZIP"
                      rows={2}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Tags (comma separated)</FormLabel>
                    <Input
                      {...register('tags')}
                      placeholder="VIP, Wholesale, Regular"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Customer Notes</FormLabel>
                    <Textarea
                      {...register('notes')}
                      placeholder="Any special notes about this customer..."
                      rows={2}
                    />
                  </FormControl>
                </SimpleGrid>

                <Box mt={4} p={4} bg="gray.50" borderRadius="md">
                  <Heading size="sm" mb={3}>Preferences</Heading>
                  <SimpleGrid columns={2} spacing={4}>
                    <FormControl display="flex" alignItems="center">
                      <Switch {...register('smsNotifications')} id="sms-notifications" mr={3} />
                      <FormLabel htmlFor="sms-notifications" mb={0} fontSize="sm">
                        SMS Notifications
                      </FormLabel>
                    </FormControl>

                    <FormControl display="flex" alignItems="center">
                      <Switch defaultChecked {...register('emailNewsletter')} id="email-newsletter" mr={3} />
                      <FormLabel htmlFor="email-newsletter" mb={0} fontSize="sm">
                        Email Newsletter
                      </FormLabel>
                    </FormControl>
                  </SimpleGrid>
                </Box>
              </ModalBody>

              <ModalFooter>
                <Button variant="ghost" mr={3} onClick={onAddClose}>Cancel</Button>
                <Button colorScheme="brand" type="submit">Add Customer</Button>
              </ModalFooter>
            </form>
          </ModalContent>
        </Modal>

        {/* Edit Customer Modal */}
        <Modal isOpen={isEditOpen} onClose={onEditClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              <Flex align="center" gap={2}>
                <Edit size={20} />
                Edit Customer
              </Flex>
            </ModalHeader>
            <form onSubmit={handleSubmit(onSubmitEdit)}>
              <ModalBody>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Full Name</FormLabel>
                    <Input {...register('name', { required: true })} placeholder="John Doe" />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Email</FormLabel>
                    <Input
                      {...register('email', {
                        pattern: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i
                      })}
                      type="email"
                      placeholder="john@example.com (Optional)"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Phone Number</FormLabel>
                    <Input
                      {...register('phone', { required: true })}
                      placeholder="+91 98765 43210"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Preferred WhatsApp Language</FormLabel>
                    <Select {...register('preferredLanguage')} defaultValue={selectedCustomer?.preferredLanguage || 'en'}>
                      <option value="en">English</option>
                      <option value="ta">Tamil</option>
                      <option value="hi">Hindi</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Date of Birth</FormLabel>
                    <Input
                      {...register('dateOfBirth')}
                      type="date"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Address</FormLabel>
                    <Textarea
                      {...register('address')}
                      placeholder="123 Main Street, City, State, ZIP"
                      rows={2}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Tags (comma separated)</FormLabel>
                    <Input
                      {...register('tags')}
                      placeholder="VIP, Wholesale, Regular"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Customer Notes</FormLabel>
                    <Textarea
                      {...register('notes')}
                      placeholder="Any special notes about this customer..."
                      rows={2}
                    />
                  </FormControl>
                </SimpleGrid>

                <Box mt={4} p={4} bg="gray.50" borderRadius="md">
                  <Heading size="sm" mb={3}>Preferences</Heading>
                  <SimpleGrid columns={2} spacing={4}>
                    <FormControl display="flex" alignItems="center">
                      <Switch {...register('smsNotifications')} id="edit-sms-notifications" mr={3} />
                      <FormLabel htmlFor="edit-sms-notifications" mb={0} fontSize="sm">
                        SMS Notifications
                      </FormLabel>
                    </FormControl>

                    <FormControl display="flex" alignItems="center">
                      <Switch {...register('emailNewsletter')} id="edit-email-newsletter" mr={3} />
                      <FormLabel htmlFor="edit-email-newsletter" mb={0} fontSize="sm">
                        Email Newsletter
                      </FormLabel>
                    </FormControl>
                  </SimpleGrid>
                </Box>
              </ModalBody>

              <ModalFooter flexDirection={{ base: 'column', sm: 'row' }} gap={3}>
                <Button variant="ghost" onClick={onEditClose} w={{ base: 'full', sm: 'auto' }}>Cancel</Button>
                <Button colorScheme="brand" type="submit" w={{ base: 'full', sm: 'auto' }}>Save Changes</Button>
              </ModalFooter>
            </form>
          </ModalContent>
        </Modal>

        {/* View Customer Drawer */}
        <Drawer isOpen={isViewOpen} placement="right" onClose={onViewClose} size="md">
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerHeader>
              <Flex align="center" gap={3}>
                <Avatar size="lg" name={selectedCustomer?.name} />
                <Box>
                  <Heading size="md">{selectedCustomer?.name}</Heading>
                  <Badge colorScheme={getTierColor(selectedCustomer?.tier).color.replace('.700', '')}>
                    {selectedCustomer?.tier} Tier
                  </Badge>
                </Box>
              </Flex>
            </DrawerHeader>

            <DrawerBody>
              {selectedCustomer && (
                <VStack align="stretch" spacing={6}>
                  {/* Contact Info */}
                  <Box>
                    <Heading size="sm" mb={3}>Contact Information</Heading>
                    <VStack align="stretch" spacing={2}>
                      <Flex align="center" gap={3}>
                        <Mail size={16} color="gray" />
                        <Text>{selectedCustomer.email}</Text>
                      </Flex>
                      <Flex align="center" gap={3}>
                        <Phone size={16} color="gray" />
                        <Text>{selectedCustomer.phone}</Text>
                      </Flex>
                      {selectedCustomer.address && (
                        <Flex align="center" gap={3}>
                          <MapPin size={16} color="gray" />
                          <Text>{selectedCustomer.address}</Text>
                        </Flex>
                      )}
                    </VStack>
                  </Box>

                  {/* Customer Stats */}
                  <Box>
                    <Heading size="sm" mb={3}>Customer Statistics</Heading>
                    <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4}>
                      <Box>
                        <Text fontSize="sm" color="gray.500">Total Spent</Text>
                        <Text fontSize="xl" fontWeight="bold" color="green.600">
                          ₹{selectedCustomer.totalSpent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.500">Loyalty Points</Text>
                        <Text fontSize="xl" fontWeight="bold" color="purple.500">
                          {Math.floor(selectedCustomer.loyaltyPoints || 0)}
                        </Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.500">Orders</Text>
                        <Text fontSize="xl" fontWeight="bold">
                          {sales.filter(s => s.customerId === (selectedCustomer._id || selectedCustomer.id)).length}
                        </Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.500">Member Since</Text>
                        <Text fontWeight="medium">
                          {formatDate(selectedCustomer.joinDate)}
                        </Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.500">Days Active</Text>
                        <Text fontWeight="medium">
                          {getDaysDifference(selectedCustomer.joinDate)} days
                        </Text>
                      </Box>
                    </SimpleGrid>
                  </Box>

                  {/* Purchase Insights - NEW SECTION */}
                  <Box>
                    <Heading size="sm" mb={3}>Purchase Patterns</Heading>
                    {(() => {
                      const customerSales = sales.filter(s => s.customerId === (selectedCustomer._id || selectedCustomer.id));

                      if (customerSales.length === 0) {
                        return <Text color="gray.500" fontSize="sm">No purchase history available yet.</Text>;
                      }

                      // AOV
                      const aov = selectedCustomer.totalSpent / customerSales.length;

                      // Purchase Frequency (Avg days between orders)
                      let avgDays = 0;
                      if (customerSales.length > 1) {
                        const sortedDates = customerSales
                          .map(s => new Date(s.date).getTime())
                          .sort((a, b) => a - b);

                        let totalDiffObj = 0;
                        for (let i = 1; i < sortedDates.length; i++) {
                          totalDiffObj += (sortedDates[i] - sortedDates[i - 1]);
                        }
                        avgDays = Math.round((totalDiffObj / (sortedDates.length - 1)) / (1000 * 60 * 60 * 24));
                      }

                      // Top Products
                      const productCounts = {};
                      customerSales.forEach(sale => {
                        (sale.items || []).forEach(item => {
                          const name = item.productName || item.name || 'Unknown';
                          if (!productCounts[name]) productCounts[name] = 0;
                          productCounts[name] += (item.quantity || 0);
                        });
                      });

                      const topProducts = Object.entries(productCounts)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 3);

                      return (
                        <VStack align="stretch" spacing={3}>
                          <SimpleGrid columns={2} spacing={3} mb={2}>
                            <Card variant="outline" size="sm">
                              <CardBody p={3}>
                                <Text fontSize="xs" color="gray.500">Avg Order Value</Text>
                                <Text fontWeight="bold">₹{Math.round(aov).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
                              </CardBody>
                            </Card>
                            <Card variant="outline" size="sm">
                              <CardBody p={3}>
                                <Text fontSize="xs" color="gray.500">Purchase Frequency</Text>
                                <Text fontWeight="bold">{avgDays > 0 ? `Every ${avgDays} days` : 'N/A'}</Text>
                              </CardBody>
                            </Card>
                          </SimpleGrid>

                          <Box>
                            <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={2}>TOP PURCHASED ITEMS</Text>
                            {topProducts.length > 0 ? (
                              <VStack align="stretch" spacing={2}>
                                {topProducts.map(([name, count], idx) => (
                                  <Flex key={idx} justify="space-between" align="center" fontSize="sm">
                                    <Text noOfLines={1}>{name}</Text>
                                    <Badge variant="subtle" colorScheme="blue">{count} bought</Badge>
                                  </Flex>
                                ))}
                              </VStack>
                            ) : (
                              <Text fontSize="sm" color="gray.500">No specific product data.</Text>
                            )}
                          </Box>
                        </VStack>
                      );
                    })()}
                  </Box>

                  {/* Recent Transactions */}
                  <Box>
                    <Heading size="sm" mb={3}>Recent Transactions</Heading>
                    <VStack align="stretch" spacing={2}>
                      {sales
                        .filter(s => s.customerId === (selectedCustomer._id || selectedCustomer.id))
                        .sort((a, b) => new Date(b.date) - new Date(a.date)) // Ensure sorted by date desc
                        .slice(0, 5)
                        .map(sale => (
                          <Flex key={sale.id || sale._id} justify="space-between" p={3} bg="gray.50" borderRadius="md" align="center">
                            <Box>
                              <Text fontSize="sm" fontWeight="medium">
                                {formatDate(sale.date)}
                              </Text>
                              <Text fontSize="xs" color="gray.500">
                                {sale.items.length} items
                              </Text>
                            </Box>
                            <Badge colorScheme={sale.status === 'completed' ? 'green' : 'orange'}>
                              ₹{(sale.total || sale.totalAmount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </Badge>
                          </Flex>
                        ))}
                    </VStack>
                  </Box>
                  {/* Actions */}
                  <HStack spacing={3} mt={4}>
                    <Button leftIcon={<Edit size={16} />} onClick={() => {
                      onViewClose();
                      handleEditCustomer(selectedCustomer);
                    }} flex={1}>
                      Edit Profile
                    </Button>
                    <Button leftIcon={<MessageSquare size={16} />} variant="outline" flex={1}>
                      Send Message
                    </Button>
                  </HStack>
                </VStack>
              )}
            </DrawerBody>
          </DrawerContent>
        </Drawer>
        {/* CSV Import Modal */}
        {renderImportModal()}

        {/* Floating Bulk Actions Bar */}
        {selectedCustomers.length > 0 && (
          <Box
            position="fixed"
            bottom={0}
            left={0}
            right={0}
            bg="white"
            borderTop="2px solid"
            borderColor="blue.500"
            shadow="2xl"
            p={4}
            zIndex={1000}
          >
            <Flex justify="space-between" align="center" maxW="1400px" mx="auto">
              <HStack>
                <CheckCircle size={20} color="#3182CE" />
                <Text fontWeight="bold" fontSize="lg">
                  {selectedCustomers.length} customer{selectedCustomers.length > 1 ? 's' : ''} selected
                </Text>
              </HStack>
              <HStack spacing={3}>
                <Button
                  leftIcon={<Mail size={18} />}
                  colorScheme="blue"
                  variant="outline"
                  onClick={() => handleBulkAction('sendEmail')}
                >
                  Send Email
                </Button>
                <Button
                  leftIcon={<Upload size={18} />}
                  colorScheme="blue"
                  variant="outline"
                  onClick={() => handleBulkAction('export')}
                >
                  Export
                </Button>
                <Button
                  leftIcon={<Hash size={18} />}
                  colorScheme="blue"
                  variant="outline"
                  onClick={() => handleBulkAction('addTag')}
                >
                  Add Tag
                </Button>
                <Button
                  leftIcon={<X size={18} />}
                  colorScheme="red"
                  variant="solid"
                  onClick={() => setSelectedCustomers([])}
                >
                  Clear Selection
                </Button>
              </HStack>
            </Flex>
          </Box>
        )}
      </Box>
    </ScaleFade>
  );
} 
