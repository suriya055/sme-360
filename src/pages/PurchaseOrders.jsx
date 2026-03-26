import React, { useState, useEffect } from 'react';
import {
    Box, Flex, Text, Button, Table, Thead, Tbody, Tr, Th, Td,
    Badge, HStack, IconButton, Input, InputGroup, InputLeftElement,
    useDisclosure, Heading, Card, CardBody, VStack, Tooltip, Spinner,
    Alert, AlertIcon, Select, Tag, Modal, ModalOverlay, ModalContent,
    ModalHeader, ModalBody, ModalFooter, FormControl, FormLabel,
    NumberInput, NumberInputField, NumberInputStepper,
    NumberIncrementStepper, NumberDecrementStepper, Divider
} from '@chakra-ui/react';
import { Plus, Search, Eye, FileSignature, CheckCircle, Trash2 } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export default function PurchaseOrders() {
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Create PO State
    const { isOpen, onOpen, onClose } = useDisclosure();
    // View PO State
    const { isOpen: isOpenView, onOpen: onOpenView, onClose: onCloseView } = useDisclosure();
    const [selectedPO, setSelectedPO] = useState(null);
    const [products, setProducts] = useState([]);
    const [newPO, setNewPO] = useState({
        supplierId: '',
        expectedDeliveryDate: '',
        taxAmount: 0,
        notes: '',
        items: []
    });
    const [productSearch, setProductSearch] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [poRes, supRes, actProdRes] = await Promise.all([
                api.get('/purchase-orders'),
                api.get('/suppliers'),
                api.get('/products')
            ]);
            setPurchaseOrders(poRes.data);
            setSuppliers(supRes.data.filter(s => s.isActive));
            setProducts(actProdRes.data);
        } catch (err) {
            toast.error('Failed to load purchase orders');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const updateStatus = async (id, status) => {
        if (!window.confirm(`Are you sure you want to change status to ${status.toUpperCase()}?`)) return;
        try {
            await api.patch(`/purchase-orders/${id}/status`, { status });
            toast.success(`PO marked as ${status}`);
            fetchData();
        } catch (err) {
            toast.error('Error updating PO status');
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'draft': return <Badge colorScheme="gray">Draft</Badge>;
            case 'sent': return <Badge colorScheme="blue">Sent</Badge>;
            case 'partially_received': return <Badge colorScheme="orange">Partially Received</Badge>;
            case 'received': return <Badge colorScheme="green">Received</Badge>;
            case 'cancelled': return <Badge colorScheme="red">Cancelled</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };

    const filteredPOs = purchaseOrders.filter(po =>
        po.poNumber.toLowerCase().includes(search.toLowerCase()) ||
        (po.supplierId?.name || '').toLowerCase().includes(search.toLowerCase())
    );

    // PO Creation Logic
    const handleAddItem = (product) => {
        if (newPO.items.find(i => i.productId === product._id)) {
            return toast.error('Product already in PO');
        }
        setNewPO(prev => ({
            ...prev,
            items: [...prev.items, {
                productId: product._id,
                name: product.name,
                quantity: 1,
                unitCost: product.cost || 0
            }]
        }));
        setProductSearch('');
    };

    const updateItem = (index, field, value) => {
        const updated = [...newPO.items];
        updated[index][field] = Number(value);
        setNewPO({ ...newPO, items: updated });
    };

    const removeItem = (index) => {
        setNewPO(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
    };

    const submitPO = async () => {
        if (!newPO.supplierId) return toast.error('Select a supplier');
        if (newPO.items.length === 0) return toast.error('Add at least one item');

        try {
            await api.post('/purchase-orders', newPO);
            toast.success('Purchase Order Created');
            onClose();
            fetchData();
            setNewPO({ supplierId: '', expectedDeliveryDate: '', taxAmount: 0, notes: '', items: [] });
        } catch (err) {
            toast.error('Failed to create PO');
        }
    };

    const poSubtotal = newPO.items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
    const poTotal = poSubtotal + Number(newPO.taxAmount);

    const searchedProducts = productSearch.trim() ? products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())) : [];

    return (
        <Box>
            <Flex justify="space-between" align={{ base: 'stretch', md: 'center' }} mb={6} flexWrap="wrap" gap={4} direction={{ base: 'column', md: 'row' }}>
                <Heading size="lg">Purchase Orders</Heading>
                <Flex w={{ base: '100%', md: 'auto' }} gap={3} direction={{ base: 'column', md: 'row' }}>
                    <InputGroup w={{ base: '100%', md: '300px' }}>
                        <InputLeftElement pointerEvents="none"><Search size={18} color="gray" /></InputLeftElement>
                        <Input
                            placeholder="Search PO number or supplier..."
                            value={search} onChange={(e) => setSearch(e.target.value)}
                            bg="white" borderRadius="xl"
                        />
                    </InputGroup>
                    <Button colorScheme="brand" leftIcon={<Plus size={18} />} onClick={onOpen} flexShrink={0} w={{ base: '100%', md: 'auto' }}>
                        <Box as="span" display={{ base: 'none', md: 'inline' }}>Create PO</Box>
                    </Button>
                </Flex>
            </Flex>

            <Card borderRadius="2xl" shadow="sm" border="1px solid" borderColor="gray.100">
                <CardBody p={0} overflowX="auto">
                    {loading ? (
                        <Flex justify="center" p={10}><Spinner color="brand.500" /></Flex>
                    ) : filteredPOs.length === 0 ? (
                        <Alert status="info"><AlertIcon />No purchase orders found.</Alert>
                    ) : (
                        <Table variant="simple" size="md">
                            <Thead bg="gray.50">
                                <Tr>
                                    <Th>PO Number</Th>
                                    <Th display={{ base: 'none', md: 'table-cell' }}>Date</Th>
                                    <Th>Supplier</Th>
                                    <Th>Amount</Th>
                                    <Th>Status</Th>
                                    <Th display={{ base: 'none', md: 'table-cell' }}>Payment</Th>
                                    <Th textAlign="right">Actions</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {filteredPOs.map(po => (
                                    <Tr key={po._id} _hover={{ bg: 'gray.50' }}>
                                        <Td fontWeight="bold" color="brand.600">
                                            {po.poNumber}
                                            <Text display={{ base: 'block', md: 'none' }} fontSize="xs" fontWeight="500" color="gray.600" mt={1}>
                                                {format(new Date(po.createdAt), 'MMM dd, yyyy')}
                                            </Text>
                                            {po.expectedDeliveryDate && (
                                                <Text display={{ base: 'block', md: 'none' }} fontSize="xs" color="gray.500">
                                                    Exp: {format(new Date(po.expectedDeliveryDate), 'MMM dd')}
                                                </Text>
                                            )}
                                        </Td>
                                        <Td display={{ base: 'none', md: 'table-cell' }}>
                                            <Text fontSize="sm" fontWeight="500">{format(new Date(po.createdAt), 'MMM dd, yyyy')}</Text>
                                            {po.expectedDeliveryDate && <Text fontSize="xs" color="gray.500">Exp: {format(new Date(po.expectedDeliveryDate), 'MMM dd')}</Text>}
                                        </Td>
                                        <Td fontWeight="500">{po.supplierId?.name || 'Unknown Supplier'}</Td>
                                        <Td fontWeight="bold">₹{po.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Td>
                                        <Td>{getStatusBadge(po.status)}</Td>
                                        <Td display={{ base: 'none', md: 'table-cell' }}>
                                            <Tag size="sm" colorScheme={po.paymentStatus === 'paid' ? 'green' : po.paymentStatus === 'partially_paid' ? 'yellow' : 'red'}>
                                                {po.paymentStatus.toUpperCase().replace('_', ' ')}
                                            </Tag>
                                        </Td>
                                        <Td textAlign="right">
                                            <HStack justify="flex-end" spacing={2}>
                                                <Tooltip label="View Details">
                                                    <IconButton icon={<Eye size={16} />} size="sm" variant="ghost" colorScheme="gray" onClick={() => { setSelectedPO(po); onOpenView(); }} />
                                                </Tooltip>

                                                {po.status === 'draft' && (
                                                    <Tooltip label="Mark as Sent to Supplier">
                                                        <IconButton icon={<FileSignature size={16} />} size="sm" variant="ghost" colorScheme="blue" onClick={() => updateStatus(po._id, 'sent')} />
                                                    </Tooltip>
                                                )}

                                                {(po.status === 'sent' || po.status === 'partially_received') && (
                                                    <Tooltip label="Mark as Received (Updates Inventory)">
                                                        <IconButton icon={<CheckCircle size={16} />} size="sm" variant="ghost" colorScheme="green" onClick={() => updateStatus(po._id, 'received')} />
                                                    </Tooltip>
                                                )}
                                            </HStack>
                                        </Td>
                                    </Tr>
                                ))}
                            </Tbody>
                        </Table>
                    )}
                </CardBody>
            </Card>

            {/* CREATE PO MODAL */}
            <Modal isOpen={isOpen} onClose={onClose} size="4xl" scrollBehavior="inside">
                <ModalOverlay backdropFilter="blur(5px)" />
                <ModalContent borderRadius="2xl">
                    <ModalHeader>Create Purchase Order</ModalHeader>
                    <ModalBody>
                        <VStack spacing={6} align="stretch">
                            <Flex gap={4}>
                                <FormControl isRequired>
                                    <FormLabel>Supplier</FormLabel>
                                    <Select placeholder="Select Supplier" value={newPO.supplierId} onChange={e => setNewPO({ ...newPO, supplierId: e.target.value })}>
                                        {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                    </Select>
                                </FormControl>
                                <FormControl>
                                    <FormLabel>Expected Delivery Date</FormLabel>
                                    <Input type="date" value={newPO.expectedDeliveryDate} onChange={e => setNewPO({ ...newPO, expectedDeliveryDate: e.target.value })} />
                                </FormControl>
                            </Flex>

                            <Divider />

                            <FormControl>
                                <FormLabel>Search & Add Products</FormLabel>
                                <Input placeholder="Type to search products..." value={productSearch} onChange={e => setProductSearch(e.target.value)} />
                                {searchedProducts.length > 0 && (
                                    <Box mt={2} maxH="150px" overflowY="auto" border="1px" borderColor="gray.200" borderRadius="md" shadow="sm">
                                        {searchedProducts.map(p => (
                                            <Flex key={p._id} p={3} _hover={{ bg: 'gray.50' }} justify="space-between" align="center" cursor="pointer" onClick={() => handleAddItem(p)}>
                                                <Box>
                                                    <Text fontWeight="bold">{p.name}</Text>
                                                    <Text fontSize="xs" color="gray.500">Current Stock: {p.stock}</Text>
                                                </Box>
                                                <Plus size={16} color="green" />
                                            </Flex>
                                        ))}
                                    </Box>
                                )}
                            </FormControl>

                            {newPO.items.length > 0 && (
                                <Table variant="simple" size="sm">
                                    <Thead bg="gray.50">
                                        <Tr>
                                            <Th>Product</Th>
                                            <Th>Qty</Th>
                                            <Th>Unit Cost (₹)</Th>
                                            <Th>Total (₹)</Th>
                                            <Th></Th>
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {newPO.items.map((item, idx) => (
                                            <Tr key={idx}>
                                                <Td fontWeight="500">{item.name}</Td>
                                                <Td>
                                                    <NumberInput min={1} max={10000} value={item.quantity} onChange={(str, val) => updateItem(idx, 'quantity', val)} size="sm" w="80px">
                                                        <NumberInputField />
                                                        <NumberInputStepper><NumberIncrementStepper /><NumberDecrementStepper /></NumberInputStepper>
                                                    </NumberInput>
                                                </Td>
                                                <Td>
                                                    <NumberInput min={0} value={item.unitCost} onChange={(str, val) => updateItem(idx, 'unitCost', val)} size="sm" w="100px">
                                                        <NumberInputField />
                                                    </NumberInput>
                                                </Td>
                                                <Td fontWeight="bold">{(item.quantity * item.unitCost).toLocaleString('en-IN')}</Td>
                                                <Td><IconButton icon={<Trash2 size={14} />} colorScheme="red" variant="ghost" size="sm" onClick={() => removeItem(idx)} /></Td>
                                            </Tr>
                                        ))}
                                    </Tbody>
                                </Table>
                            )}

                            <Flex justify="flex-end" direction="column" align="flex-end" gap={2} bg="gray.50" p={4} borderRadius="xl">
                                <Flex justify="space-between" w="250px">
                                    <Text fontWeight="500" color="gray.500">Subtotal:</Text>
                                    <Text>₹{poSubtotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
                                </Flex>
                                <Flex justify="space-between" w="250px" align="center">
                                    <Text fontWeight="500" color="gray.500">Tax:</Text>
                                    <Input size="sm" w="100px" type="number" value={newPO.taxAmount} onChange={e => setNewPO({ ...newPO, taxAmount: e.target.value })} />
                                </Flex>
                                <Divider />
                                <Flex justify="space-between" w="250px">
                                    <Text fontWeight="bold" fontSize="lg">Total:</Text>
                                    <Text fontWeight="bold" fontSize="lg" color="brand.600">₹{poTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
                                </Flex>
                            </Flex>
                            <FormControl>
                                <FormLabel>Notes</FormLabel>
                                <Input placeholder="Additional instructions..." value={newPO.notes} onChange={e => setNewPO({ ...newPO, notes: e.target.value })} />
                            </FormControl>
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
                        <Button colorScheme="brand" onClick={submitPO} isDisabled={newPO.items.length === 0}>Draft Purchase Order</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
            {/* VIEW PO MODAL */}
            <Modal isOpen={isOpenView} onClose={onCloseView} size="3xl" scrollBehavior="inside">
                <ModalOverlay backdropFilter="blur(5px)" />
                <ModalContent borderRadius="2xl">
                    <ModalHeader>Purchase Order Details</ModalHeader>
                    <ModalBody>
                        {selectedPO && (
                            <VStack spacing={6} align="stretch">
                                <Flex justify="space-between" bg="gray.50" p={4} borderRadius="xl">
                                    <Box>
                                        <Text fontSize="sm" color="gray.500" mb={1}>Supplier</Text>
                                        <Text fontWeight="bold" fontSize="lg">{selectedPO.supplierId?.name || 'Unknown'}</Text>
                                        <Text fontSize="sm">{selectedPO.supplierId?.email}</Text>
                                    </Box>
                                    <Box textAlign="right">
                                        <Text fontSize="sm" color="gray.500" mb={1}>PO Number</Text>
                                        <Text fontWeight="bold" fontSize="lg" color="brand.600">{selectedPO.poNumber}</Text>
                                        <HStack justify="flex-end" mt={1}>
                                            {getStatusBadge(selectedPO.status)}
                                        </HStack>
                                    </Box>
                                </Flex>

                                <Table variant="simple" size="sm">
                                    <Thead bg="gray.100">
                                        <Tr>
                                            <Th>Product</Th>
                                            <Th isNumeric>Quantity</Th>
                                            <Th isNumeric>Unit Cost</Th>
                                            <Th isNumeric>Total</Th>
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {selectedPO.items.map((item, idx) => (
                                            <Tr key={idx}>
                                                <Td fontWeight="500">{item.name}</Td>
                                                <Td isNumeric>{item.quantity}</Td>
                                                <Td isNumeric>₹{item.unitCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Td>
                                                <Td isNumeric fontWeight="bold">₹{(item.quantity * item.unitCost).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Td>
                                            </Tr>
                                        ))}
                                    </Tbody>
                                </Table>

                                <Flex justify="flex-end">
                                    <Box w="250px" bg="gray.50" p={4} borderRadius="xl">
                                        <Flex justify="space-between" mb={2}>
                                            <Text color="gray.500">Subtotal:</Text>
                                            <Text>₹{(selectedPO.totalAmount - selectedPO.taxAmount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
                                        </Flex>
                                        <Flex justify="space-between" mb={2}>
                                            <Text color="gray.500">Tax:</Text>
                                            <Text>₹{selectedPO.taxAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
                                        </Flex>
                                        <Divider my={2} />
                                        <Flex justify="space-between">
                                            <Text fontWeight="bold" fontSize="lg">Total:</Text>
                                            <Text fontWeight="bold" fontSize="lg" color="brand.600">₹{selectedPO.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
                                        </Flex>
                                    </Box>
                                </Flex>

                                {selectedPO.notes && (
                                    <Box p={4} bg="blue.50" borderRadius="xl">
                                        <Text fontWeight="bold" fontSize="sm" color="blue.800" mb={1}>Notes</Text>
                                        <Text fontSize="sm" color="blue.600">{selectedPO.notes}</Text>
                                    </Box>
                                )}
                            </VStack>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button colorScheme="brand" onClick={onCloseView}>Close</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    );
}
