import React, { useState, useEffect } from 'react';
import {
    Box, Flex, Text, Heading, Button, Table, Thead, Tbody, Tr, Th, Td, Badge,
    useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton,
    ModalBody, ModalFooter, FormControl, FormLabel, Input, Select, VStack, HStack,
    useColorModeValue, IconButton, Tooltip, Stat, StatLabel, StatNumber, StatHelpText,
    SimpleGrid, Progress, Card, CardBody
} from '@chakra-ui/react';
import { Plus, Wallet, FileText, CheckCircle, Clock } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function AccountsPayable() {
    const [payables, setPayables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [suppliers, setSuppliers] = useState([]);

    // Modals
    const { isOpen: isNewBillOpen, onOpen: onNewBillOpen, onClose: onNewBillClose } = useDisclosure();
    const { isOpen: isPayOpen, onOpen: onPayOpen, onClose: onPayClose } = useDisclosure();

    // State
    const [selectedPayable, setSelectedPayable] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('bank_transfer');

    const [newBill, setNewBill] = useState({
        title: '', supplierId: '', amountTotal: '', dueDate: '', notes: ''
    });

    const bg = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [payRes, supRes] = await Promise.all([
                api.get('/payables'),
                api.get('/suppliers')
            ]);
            setPayables(payRes.data);
            setSuppliers(supRes.data);
        } catch (err) {
            toast.error('Failed to load accounts payable data');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBill = async (e) => {
        e.preventDefault();
        try {
            await api.post('/payables', newBill);
            toast.success('Manual Bill Created');
            onNewBillClose();
            fetchData();
            setNewBill({ title: '', supplierId: '', amountTotal: '', dueDate: '', notes: '' });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create bill');
        }
    };

    const handleLogPayment = async (e) => {
        e.preventDefault();
        if (!selectedPayable) return;

        try {
            await api.post(`/payables/${selectedPayable._id}/payments`, {
                amount: Number(paymentAmount),
                paymentMethod
            });

            toast.success('Payment logged successfully');
            onPayClose();
            fetchData();
            setPaymentAmount('');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to log payment');
        }
    };

    // KPIs
    const totalUnpaid = payables
        .filter(p => ['pending', 'partially_paid'].includes(p.status))
        .reduce((acc, p) => acc + (p.amountTotal - p.amountPaid), 0);

    const totalOverdue = payables
        .filter(p => ['pending', 'partially_paid'].includes(p.status) && new Date(p.dueDate) < new Date())
        .reduce((acc, p) => acc + (p.amountTotal - p.amountPaid), 0);

    return (
        <Box p={{ base: 0, md: 6 }}>
            <Flex justify="space-between" align={{ base: 'stretch', md: 'center' }} mb={6} direction={{ base: 'column', md: 'row' }} gap={4}>
                <Box>
                    <Heading size="lg" mb={1} color="gray.800">Accounts Payable</Heading>
                    <Text color="gray.500">Manage money owed to suppliers and vendors</Text>
                </Box>
                <Button leftIcon={<Plus size={18} />} colorScheme="brand" onClick={onNewBillOpen} w={{ base: 'full', md: 'auto' }}>
                    <Box as="span" display={{ base: 'none', md: 'inline' }}>Add Manual Bill</Box>
                </Button>
            </Flex>

            {/* KPI Cards */}
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={8}>
                <Card bg={bg} border="1px" borderColor={borderColor} shadow="sm">
                    <CardBody>
                        <Flex align="center" justify="space-between">
                            <Box>
                                <Text color="gray.500" fontSize="sm" fontWeight="medium" textTransform="uppercase">Total Outstanding</Text>
                                <Text fontSize="3xl" fontWeight="bold" color="brand.600">₹{totalUnpaid.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
                            </Box>
                            <Box p={3} bg="brand.50" rounded="full" color="brand.500">
                                <Wallet size={24} />
                            </Box>
                        </Flex>
                    </CardBody>
                </Card>

                <Card bg={bg} border="1px" borderColor={borderColor} shadow="sm">
                    <CardBody>
                        <Flex align="center" justify="space-between">
                            <Box>
                                <Text color="red.500" fontSize="sm" fontWeight="medium" textTransform="uppercase">Overdue Amount</Text>
                                <Text fontSize="3xl" fontWeight="bold" color="red.600">₹{totalOverdue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
                            </Box>
                            <Box p={3} bg="red.50" rounded="full" color="red.500">
                                <Clock size={24} />
                            </Box>
                        </Flex>
                    </CardBody>
                </Card>

                <Card bg={bg} border="1px" borderColor={borderColor} shadow="sm">
                    <CardBody>
                        <Flex align="center" justify="space-between">
                            <Box>
                                <Text color="gray.500" fontSize="sm" fontWeight="medium" textTransform="uppercase">Pending Bills</Text>
                                <Text fontSize="3xl" fontWeight="bold" color="gray.700">
                                    {payables.filter(p => ['pending', 'partially_paid'].includes(p.status)).length}
                                </Text>
                            </Box>
                            <Box p={3} bg="gray.100" rounded="full" color="gray.600">
                                <FileText size={24} />
                            </Box>
                        </Flex>
                    </CardBody>
                </Card>
            </SimpleGrid>

            {/* Main Table */}
            <Box bg={bg} borderRadius="2xl" borderWidth="1px" borderColor={borderColor} overflow="hidden" shadow="sm">
                <Box overflowX="auto">
                    <Table variant="simple">
                        <Thead bg="gray.50">
                            <Tr>
                                <Th>Reference / Title</Th>
                                <Th display={{ base: 'none', md: 'table-cell' }}>Supplier</Th>
                                <Th>Total Amount</Th>
                                <Th>Paid / Balance</Th>
                                <Th display={{ base: 'none', md: 'table-cell' }}>Due Date</Th>
                                <Th>Status</Th>
                                <Th textAlign="right">Actions</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {loading ? (
                                <Tr><Td colSpan={7} textAlign="center" py={10}>Loading payables...</Td></Tr>
                            ) : payables.length === 0 ? (
                                <Tr><Td colSpan={7} textAlign="center" py={10} color="gray.500">No payables found.</Td></Tr>
                            ) : (
                                payables.map(payable => {
                                    const isOverdue = new Date(payable.dueDate) < new Date() && !['paid', 'cancelled'].includes(payable.status);
                                    const balance = payable.amountTotal - payable.amountPaid;
                                    const progress = (payable.amountPaid / payable.amountTotal) * 100;

                                    return (
                                        <Tr key={payable._id} _hover={{ bg: 'gray.50' }}>
                                            <Td>
                                                <Text fontWeight="bold">{payable.referenceNumber}</Text>
                                                <Text fontSize="xs" color="gray.500">{payable.title}</Text>
                                                {payable.supplierId?.name && (
                                                    <Badge mt={2} display={{ base: 'inline-flex', md: 'none' }} colorScheme="purple" variant="subtle">
                                                        {payable.supplierId.name}
                                                    </Badge>
                                                )}
                                                {payable.dueDate ? (
                                                    <Text display={{ base: 'block', md: 'none' }} mt={1} fontSize="xs" color={isOverdue ? "red.500" : "gray.600"} fontWeight={isOverdue ? "bold" : "normal"}>
                                                        Due: {format(new Date(payable.dueDate), 'dd MMM yyyy')}{isOverdue ? ' (Overdue)' : ''}
                                                    </Text>
                                                ) : null}
                                            </Td>
                                            <Td display={{ base: 'none', md: 'table-cell' }}>
                                                <Badge colorScheme="purple" variant="subtle">
                                                    {payable.supplierId ? payable.supplierId.name : 'Internal / Other'}
                                                </Badge>
                                            </Td>
                                            <Td fontWeight="bold">₹{payable.amountTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Td>
                                            <Td>
                                                <Box w="full" maxW="120px">
                                                    <Flex justify="space-between" fontSize="xs" mb={1} color="gray.600">
                                                        <Text>₹{payable.amountPaid.toFixed(0)}</Text>
                                                        <Text color="brand.600" fontWeight="bold">₹{balance.toFixed(0)} bal</Text>
                                                    </Flex>
                                                    <Progress value={progress} size="xs" colorScheme="brand" borderRadius="full" />
                                                </Box>
                                            </Td>
                                            <Td display={{ base: 'none', md: 'table-cell' }}>
                                                {payable.dueDate ? (
                                                    <Text color={isOverdue ? "red.500" : "gray.600"} fontWeight={isOverdue ? "bold" : "normal"}>
                                                        {format(new Date(payable.dueDate), 'dd MMM yyyy')}
                                                        {isOverdue && " (Overdue)"}
                                                    </Text>
                                                ) : '-'}
                                            </Td>
                                            <Td>
                                                <Badge
                                                    colorScheme={
                                                        payable.status === 'paid' ? 'green' :
                                                            payable.status === 'partially_paid' ? 'orange' :
                                                                payable.status === 'cancelled' ? 'red' : 'gray'
                                                    }
                                                >
                                                    {payable.status.replace('_', ' ').toUpperCase()}
                                                </Badge>
                                            </Td>
                                            <Td textAlign="right">
                                                {!['paid', 'cancelled'].includes(payable.status) && (
                                                    <HStack justify="flex-end">
                                                        <Button
                                                            display={{ base: 'none', md: 'inline-flex' }}
                                                            size="sm"
                                                            colorScheme="brand"
                                                            variant="outline"
                                                            leftIcon={<Wallet size={14} />}
                                                            onClick={() => {
                                                                setSelectedPayable(payable);
                                                                setPaymentAmount(balance); // Default to full remaining balance
                                                                onPayOpen();
                                                            }}
                                                        >
                                                            Pay
                                                        </Button>
                                                        <IconButton
                                                            display={{ base: 'inline-flex', md: 'none' }}
                                                            aria-label="Log payment"
                                                            size="sm"
                                                            variant="outline"
                                                            colorScheme="brand"
                                                            icon={<Wallet size={16} />}
                                                            onClick={() => {
                                                                setSelectedPayable(payable);
                                                                setPaymentAmount(balance);
                                                                onPayOpen();
                                                            }}
                                                        />
                                                    </HStack>
                                                )}
                                                {payable.status === 'paid' && (
                                                    <Tooltip label="Fully Paid">
                                                        <CheckCircle color="#10B981" />
                                                    </Tooltip>
                                                )}
                                            </Td>
                                        </Tr>
                                    );
                                })
                            )}
                        </Tbody>
                    </Table>
                </Box>
            </Box>

            {/* Add Manual Bill Modal */}
            <Modal isOpen={isNewBillOpen} onClose={onNewBillClose}>
                <ModalOverlay />
                <ModalContent as="form" onSubmit={handleCreateBill} borderRadius="xl">
                    <ModalHeader>Add Manual Bill</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4}>
                            <FormControl isRequired>
                                <FormLabel>Title / Description</FormLabel>
                                <Input placeholder="e.g. April Shop Rent" value={newBill.title} onChange={e => setNewBill({ ...newBill, title: e.target.value })} />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>Total Amount Owed (₹)</FormLabel>
                                <Input type="number" step="0.01" value={newBill.amountTotal} onChange={e => setNewBill({ ...newBill, amountTotal: e.target.value })} />
                            </FormControl>

                            <FormControl>
                                <FormLabel>Link to Supplier (Optional)</FormLabel>
                                <Select placeholder="Select Supplier..." value={newBill.supplierId} onChange={e => setNewBill({ ...newBill, supplierId: e.target.value })}>
                                    {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                </Select>
                            </FormControl>

                            <FormControl>
                                <FormLabel>Due Date</FormLabel>
                                <Input type="date" value={newBill.dueDate} onChange={e => setNewBill({ ...newBill, dueDate: e.target.value })} />
                            </FormControl>

                            <FormControl>
                                <FormLabel>Notes</FormLabel>
                                <Input value={newBill.notes} onChange={e => setNewBill({ ...newBill, notes: e.target.value })} />
                            </FormControl>
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onNewBillClose}>Cancel</Button>
                        <Button colorScheme="brand" type="submit">Create Bill</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Log Payment Modal */}
            <Modal isOpen={isPayOpen} onClose={onPayClose}>
                <ModalOverlay />
                <ModalContent as="form" onSubmit={handleLogPayment} borderRadius="xl">
                    <ModalHeader>Log Payment</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        {selectedPayable && (
                            <Box mb={4} p={3} bg="gray.50" borderRadius="md" border="1px" borderColor="gray.200">
                                <Text fontWeight="bold">{selectedPayable.title}</Text>
                                <Text fontSize="sm" color="gray.500">Total: ₹{selectedPayable.amountTotal}</Text>
                                <Text fontSize="sm" color="brand.600" fontWeight="bold">
                                    Remaining Balance: ₹{(selectedPayable.amountTotal - selectedPayable.amountPaid).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                </Text>
                            </Box>
                        )}

                        <VStack spacing={4}>
                            <FormControl isRequired>
                                <FormLabel>Payment Amount (₹)</FormLabel>
                                <Input
                                    type="number"
                                    step="0.01"
                                    max={selectedPayable ? (selectedPayable.amountTotal - selectedPayable.amountPaid) : undefined}
                                    value={paymentAmount}
                                    onChange={e => setPaymentAmount(e.target.value)}
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>Payment Method</FormLabel>
                                <Select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                                    <option value="bank_transfer">Bank Transfer</option>
                                    <option value="cash">Cash</option>
                                    <option value="cheque">Cheque</option>
                                    <option value="upi">UPI</option>
                                </Select>
                            </FormControl>

                            <Text fontSize="xs" color="gray.500">
                                Note: Logging this payment will automatically create an Expense record linked to this payable.
                            </Text>
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onPayClose}>Cancel</Button>
                        <Button colorScheme="green" type="submit">Confirm Payment</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

        </Box>
    );
}
