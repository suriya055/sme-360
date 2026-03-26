import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Heading, Table, Thead, Tbody, Tr, Th, Td,
  Badge, Button, Flex, Text, useDisclosure,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
  FormControl, FormLabel, Input, Select, SimpleGrid, Card, CardBody,
  InputGroup, InputLeftElement, Tag, TagLabel, TagRightIcon,
  HStack, IconButton, Menu, MenuButton, MenuList, MenuItem,
  Stat, StatNumber, StatLabel, StatHelpText, Progress,
  Tabs, TabList, TabPanels, Tab, TabPanel,
  Grid, GridItem, Tooltip, useToast, ScaleFade, SlideFade
} from '@chakra-ui/react';
import {
  Plus, Search, Filter, Calendar,
  Edit, Trash2, Upload, DollarSign,
  BarChart3, MoreVertical, CheckCircle,
  ChevronDown, ChevronUp, Eye, EyeOff, Receipt
} from 'lucide-react';
import { useApp } from '../hooks/useApp';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';

export default function Expenses() {
  const { expenses, addExpense, updateExpense, deleteExpense, user, hasPermission } = useApp();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [dateRange, setDateRange] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedExpense, setSelectedExpense] = useState(null);
  const toast = useToast();

  const { register, handleSubmit, reset, setValue } = useForm({
    defaultValues: {
      description: '',
      category: 'Rent',
      amount: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      status: 'Pending',
      receiptNumber: `REC-${Date.now().toString().slice(-6)}`,
      paymentMethod: 'Cash',
      notes: ''
    }
  });

  // Get all unique categories
  const categories = useMemo(() => {
    const cats = ['All', ...new Set(expenses.map(e => e.category))];
    return cats;
  }, [expenses]);

  // Filter and sort expenses
  const filteredExpenses = useMemo(() => {
    let result = [...expenses];

    // Search filter
    if (searchTerm) {
      result = result.filter(expense =>
        expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'All') {
      result = result.filter(expense => expense.category === selectedCategory);
    }

    // Date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      let startDate = new Date();

      switch (dateRange) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      result = result.filter(expense => new Date(expense.date) >= startDate);
    }

    // Sorting
    result.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'category':
          aValue = a.category;
          bValue = b.category;
          break;
        case 'date':
        default:
          aValue = new Date(a.date);
          bValue = new Date(b.date);
      }

      if (sortOrder === 'desc') {
        return bValue > aValue ? 1 : -1;
      } else {
        return aValue > bValue ? 1 : -1;
      }
    });

    return result;
  }, [expenses, searchTerm, selectedCategory, dateRange, sortBy, sortOrder]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const total = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const approved = filteredExpenses.filter(e => e.status === 'Approved').reduce((sum, e) => sum + e.amount, 0);
    const pending = filteredExpenses.filter(e => e.status === 'Pending').reduce((sum, e) => sum + e.amount, 0);

    return {
      total,
      approved,
      pending,
      count: filteredExpenses.length,
      avgExpense: filteredExpenses.length > 0 ? total / filteredExpenses.length : 0
    };
  }, [filteredExpenses]);

  // Form submission
  const onSubmit = (data) => {
    const expenseData = {
      ...data,
      amount: parseFloat(data.amount),
      date: new Date(data.date).toISOString(),
      approvedBy: selectedExpense?.approvedBy || user?.name || 'Admin'
    };

    if (selectedExpense) {
      // Update existing expense
      updateExpense(selectedExpense.id, expenseData);
      toast({
        title: 'Expense updated',
        status: 'success',
        duration: 2000,
      });
    } else {
      // Add new expense
      addExpense(expenseData);
      toast({
        title: 'Expense added',
        status: 'success',
        duration: 2000,
      });
    }

    reset();
    setSelectedExpense(null);
    onClose();
  };

  // Edit expense
  const handleEdit = (expense) => {
    setSelectedExpense(expense);
    Object.keys(expense).forEach(key => {
      if (key === 'date') {
        setValue(key, format(new Date(expense[key]), 'yyyy-MM-dd'));
      } else {
        setValue(key, expense[key]);
      }
    });
    onOpen();
  };

  // Delete expense
  const handleDelete = (expenseId) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      deleteExpense(expenseId);
      toast({
        title: 'Expense deleted',
        status: 'success',
        duration: 2000,
      });
    }
  };

  // Approve expense - FIXED
  const handleApprove = (expenseId) => {
    const expense = expenses.find(e => e.id === expenseId);
    if (expense) {
      updateExpense(expenseId, {
        status: 'Approved',
        approvedBy: user?.name || 'Admin'
      });
      toast({
        title: 'Expense approved',
        status: 'success',
        duration: 2000,
      });
    }
  };

  // Export functionality
  const handleExport = () => {
    const csvContent = [
      ['Description', 'Category', 'Amount', 'Date', 'Status', 'Payment Method'].join(','),
      ...filteredExpenses.map(e => [
        `"${e.description}"`,
        e.category,
        e.amount,
        new Date(e.date).toLocaleDateString(),
        e.status,
        e.paymentMethod || 'Cash'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();

    toast({
      title: 'Report exported',
      description: 'Expense report downloaded successfully',
      status: 'success',
      duration: 2000,
    });
  };

  return (
    <ScaleFade in={true} initialScale={0.95}>
      <Box minH="calc(100vh - 80px)">
        {/* Header */}
        <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ base: 'stretch', md: 'center' }} mb={6} gap={4}>
          <Box>
            <Heading size="lg" mb={2}>Expense Management</Heading>
            <Text color="gray.500">Track and manage your business expenses</Text>
          </Box>
          <HStack spacing={3} wrap={{ base: 'wrap', sm: 'nowrap' }}>
            <Button
              leftIcon={<Upload size={18} />}
              variant="outline"
              onClick={handleExport}
              flex={{ base: '1', sm: 'initial' }}
            >
              Export Report
            </Button>
            {hasPermission('canManageExpenses') && (
              <Button
                leftIcon={<Plus size={18} />}
                colorScheme="brand"
                onClick={() => {
                  setSelectedExpense(null);
                  reset();
                  onOpen();
                }}
                w={{ base: 'full', sm: 'auto' }}
              >
                Add Expense
              </Button>
            )}
          </HStack>
        </Flex>

        {/* Quick Stats */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
          <Card borderLeft="4px solid" borderLeftColor="brand.500">
            <CardBody>
              <Stat>
                <StatLabel color="gray.500">Total Expenses</StatLabel>
                <StatNumber fontSize="2xl">₹{metrics.total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</StatNumber>
                <StatHelpText>{metrics.count} expenses</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card borderLeft="4px solid" borderLeftColor="green.500">
            <CardBody>
              <Stat>
                <StatLabel color="gray.500">Approved</StatLabel>
                <StatNumber fontSize="2xl">₹{metrics.approved.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</StatNumber>
                <StatHelpText>
                  <Progress
                    value={(metrics.approved / (metrics.total || 1)) * 100}
                    size="sm"
                    colorScheme="green"
                    mt={2}
                  />
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card borderLeft="4px solid" borderLeftColor="orange.500">
            <CardBody>
              <Stat>
                <StatLabel color="gray.500">Pending</StatLabel>
                <StatNumber fontSize="2xl">₹{metrics.pending.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</StatNumber>
                <StatHelpText>Needs review</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card borderLeft="4px solid" borderLeftColor="purple.500">
            <CardBody>
              <Stat>
                <StatLabel color="gray.500">Avg per Expense</StatLabel>
                <StatNumber fontSize="2xl">₹{metrics.avgExpense.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</StatNumber>
                <StatHelpText>Average amount</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Filters & Search */}
        <Card mb={6}>
          <CardBody>
            <Grid templateColumns={{ base: "1fr", md: "repeat(4, 1fr)" }} gap={4}>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <Search size={18} color="gray" />
                </InputLeftElement>
                <Input
                  placeholder="Search expenses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>

              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </Select>

              <Select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="year">Last Year</option>
              </Select>

              <HStack spacing={2}>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="date">Sort by Date</option>
                  <option value="amount">Sort by Amount</option>
                  <option value="category">Sort by Category</option>
                </Select>
                <IconButton
                  icon={sortOrder === 'desc' ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                  onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                  aria-label="Sort order"
                  variant="outline"
                />
              </HStack>
            </Grid>
          </CardBody>
        </Card>

        {/* Expenses Table */}
        <Card>
          <CardBody p={0}>
            <Box overflowX="auto">
              <Table variant="simple">
                <Thead bg="gray.50">
                  <Tr>
                    <Th>Description</Th>
                    <Th>Category</Th>
                    <Th>Date</Th>
                    <Th>Status</Th>
                    <Th>Payment</Th>
                    <Th isNumeric>Amount</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredExpenses.length === 0 ? (
                    <Tr>
                      <Td colSpan={7} textAlign="center" py={10}>
                        <Box>
                          <Receipt size={48} style={{ margin: '0 auto 16px', color: '#CBD5E0' }} />
                          <Text color="gray.500">No expenses found</Text>
                        </Box>
                      </Td>
                    </Tr>
                  ) : (
                    filteredExpenses.map(expense => (
                      <Tr key={expense.id} _hover={{ bg: 'gray.50' }}>
                        <Td>
                          <Box>
                            <Text fontWeight="medium">{expense.description}</Text>
                            {expense.notes && (
                              <Text fontSize="xs" color="gray.500" noOfLines={1}>
                                {expense.notes}
                              </Text>
                            )}
                          </Box>
                        </Td>
                        <Td>
                          <Badge
                            variant="subtle"
                            colorScheme={
                              expense.category === 'Rent' ? 'purple' :
                                expense.category === 'Utilities' ? 'blue' :
                                  expense.category === 'Inventory' ? 'green' :
                                    expense.category === 'Marketing' ? 'orange' : 'gray'
                            }
                          >
                            {expense.category}
                          </Badge>
                        </Td>
                        <Td>
                          <Text fontSize="sm" color="gray.500">
                            {format(new Date(expense.date), 'MMM dd, yyyy')}
                          </Text>
                        </Td>
                        <Td>
                          <Badge
                            colorScheme={expense.status === 'Approved' ? 'green' : 'orange'}
                            variant="subtle"
                          >
                            {expense.status}
                          </Badge>
                        </Td>
                        <Td>
                          <Text fontSize="sm">{expense.paymentMethod || 'Cash'}</Text>
                          {expense.receiptNumber && (
                            <Text fontSize="xs" color="gray.500">{expense.receiptNumber}</Text>
                          )}
                        </Td>
                        <Td isNumeric fontWeight="bold" fontSize="lg">
                          ₹{expense.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </Td>
                        <Td>
                          <HStack spacing={2}>
                            {expense.status === 'Pending' && hasPermission('canApproveExpenses') && (
                              <Tooltip label="Approve">
                                <IconButton
                                  icon={<CheckCircle size={16} />}
                                  size="sm"
                                  colorScheme="green"
                                  variant="ghost"
                                  onClick={() => handleApprove(expense.id)}
                                />
                              </Tooltip>
                            )}
                            {hasPermission('canManageExpenses') && (
                              <Tooltip label="Edit">
                                <IconButton
                                  icon={<Edit size={16} />}
                                  size="sm"
                                  colorScheme="blue"
                                  variant="ghost"
                                  onClick={() => handleEdit(expense)}
                                />
                              </Tooltip>
                            )}
                            {(hasPermission('canManageExpenses') || hasPermission('canDeleteRecords')) && (
                              <Tooltip label="Delete">
                                <IconButton
                                  icon={<Trash2 size={16} />}
                                  size="sm"
                                  colorScheme="red"
                                  variant="ghost"
                                  onClick={() => handleDelete(expense.id)}
                                />
                              </Tooltip>
                            )}
                          </HStack>
                        </Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </Table>
            </Box>

            {/* Summary Footer */}
            {filteredExpenses.length > 0 && (
              <Box p={4} borderTop="1px" borderColor="gray.100" bg="gray.50">
                <Flex justify="space-between" align="center">
                  <Text color="gray.500">
                    Showing {filteredExpenses.length} expenses
                  </Text>
                  <Text fontWeight="bold" fontSize="lg">
                    Total: ₹{metrics.total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </Text>
                </Flex>
              </Box>
            )}
          </CardBody>
        </Card>

        {/* Add/Edit Expense Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              {selectedExpense ? 'Edit Expense' : 'Add New Expense'}
            </ModalHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
              <ModalBody>
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <FormControl isRequired>
                    <FormLabel>Description</FormLabel>
                    <Input {...register('description')} placeholder="What was this expense for?" />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Category</FormLabel>
                    <Select {...register('category')}>
                      <option value="Rent">Rent</option>
                      <option value="Utilities">Utilities</option>
                      <option value="Inventory">Inventory</option>
                      <option value="Salaries">Salaries</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Other">Other</option>
                    </Select>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Amount (₹)</FormLabel>
                    <InputGroup>
                      <InputLeftElement pointerEvents="none">
                        <DollarSign size={18} color="gray" />
                      </InputLeftElement>
                      <Input
                        {...register('amount')}
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </InputGroup>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Date</FormLabel>
                    <Input
                      {...register('date')}
                      type="date"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Payment Method</FormLabel>
                    <Select {...register('paymentMethod')}>
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="UPI">UPI</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Status</FormLabel>
                    <Select {...register('status')}>
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                    </Select>
                  </FormControl>

                  <GridItem colSpan={2}>
                    <FormControl>
                      <FormLabel>Receipt Number (Optional)</FormLabel>
                      <Input
                        {...register('receiptNumber')}
                        placeholder="e.g., REC-20240101-001"
                      />
                    </FormControl>
                  </GridItem>

                  <GridItem colSpan={2}>
                    <FormControl>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <Input
                        {...register('notes')}
                        as="textarea"
                        rows={3}
                        placeholder="Additional details..."
                      />
                    </FormControl>
                  </GridItem>
                </Grid>
              </ModalBody>
              <ModalFooter flexDirection={{ base: 'column', sm: 'row' }} gap={3}>
                <Button variant="ghost" onClick={onClose} w={{ base: 'full', sm: 'auto' }}>
                  Cancel
                </Button>
                <Button colorScheme="brand" type="submit" w={{ base: 'full', sm: 'auto' }}>
                  {selectedExpense ? 'Update Expense' : 'Add Expense'}
                </Button>
              </ModalFooter>
            </form>
          </ModalContent>
        </Modal>
      </Box>
    </ScaleFade>
  );
}
