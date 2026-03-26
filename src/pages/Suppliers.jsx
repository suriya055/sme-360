import React, { useState, useEffect } from 'react';
import {
    Box, Flex, Text, Button, Table, Thead, Tbody, Tr, Th, Td,
    Badge, HStack, IconButton, Input, InputGroup, InputLeftElement,
    useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader,
    ModalBody, ModalFooter, FormControl, FormLabel, Switch, Heading,
    Card, CardBody, VStack, Tooltip, Spinner, Alert, AlertIcon
} from '@chakra-ui/react';

import { Plus, Search, Edit2, Trash2, Phone, Mail, MapPin } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Suppliers() {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const { isOpen, onOpen, onClose } = useDisclosure();
    const [editingId, setEditingId] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '', contactPerson: '', email: '', phone: '', address: '', taxId: '', isActive: true
    });

    const fetchSuppliers = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/suppliers');
            setSuppliers(data);
        } catch (err) {
            toast.error('Failed to load suppliers');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const handleOpenModal = (supplier = null) => {
        if (supplier) {
            setEditingId(supplier._id);
            setFormData({
                name: supplier.name, contactPerson: supplier.contactPerson || '',
                email: supplier.email || '', phone: supplier.phone || '',
                address: supplier.address || '', taxId: supplier.taxId || '',
                isActive: supplier.isActive
            });
        } else {
            setEditingId(null);
            setFormData({ name: '', contactPerson: '', email: '', phone: '', address: '', taxId: '', isActive: true });
        }
        onOpen();
    };

    const handleSave = async () => {
        if (!formData.name.trim()) return toast.error('Supplier Name is required');
        try {
            if (editingId) {
                await api.put(`/suppliers/${editingId}`, formData);
                toast.success('Supplier updated');
            } else {
                await api.post('/suppliers', formData);
                toast.success('Supplier added');
            }
            onClose();
            fetchSuppliers();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error saving supplier');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this supplier? Cannot be undone if not linked to POs.')) return;
        try {
            await api.delete(`/suppliers/${id}`);
            toast.success('Supplier deleted');
            fetchSuppliers();
        } catch (err) {
            toast.error('Cannot delete supplier; it might be linked to existing Purchase Orders.');
        }
    };

    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.contactPerson?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Box>
            <Flex justify="space-between" align={{ base: 'stretch', md: 'center' }} mb={6} flexWrap="wrap" gap={4} direction={{ base: 'column', md: 'row' }}>
                <Heading size="lg">Supplier Profile Management</Heading>
                <Flex w={{ base: '100%', md: 'auto' }} gap={3} direction={{ base: 'column', md: 'row' }}>
                    <InputGroup w={{ base: '100%', md: '300px' }}>
                        <InputLeftElement pointerEvents="none"><Search size={18} color="gray" /></InputLeftElement>
                        <Input
                            placeholder="Search suppliers..."
                            value={search} onChange={(e) => setSearch(e.target.value)}
                            bg="white" borderRadius="xl"
                        />
                    </InputGroup>
                    <Button colorScheme="brand" leftIcon={<Plus size={18} />} onClick={() => handleOpenModal()} flexShrink={0} w={{ base: '100%', md: 'auto' }}>
                        <Box as="span" display={{ base: 'none', md: 'inline' }}>Add Supplier</Box>
                    </Button>
                </Flex>
            </Flex>

            <Card borderRadius="2xl" shadow="sm" border="1px solid" borderColor="gray.100">
                <CardBody p={0} overflowX="auto">
                    {loading ? (
                        <Flex justify="center" p={10}><Spinner color="brand.500" /></Flex>
                    ) : filteredSuppliers.length === 0 ? (
                        <Alert status="info"><AlertIcon />No suppliers found.</Alert>
                    ) : (
                        <Table variant="simple" size="md">
                            <Thead bg="gray.50">
                                <Tr>
                                    <Th>Supplier Name</Th>
                                    <Th display={{ base: 'none', md: 'table-cell' }}>Contact Person</Th>
                                    <Th>Contact Info</Th>
                                    <Th>Status</Th>
                                    <Th textAlign="right">Actions</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {filteredSuppliers.map(s => (
                                    <Tr key={s._id} _hover={{ bg: 'gray.50' }}>
                                        <Td fontWeight="bold">
                                            {s.name}
                                            {s.taxId && <Text fontSize="xs" color="gray.500" fontWeight="normal">Tax ID: {s.taxId}</Text>}
                                            {s.contactPerson && (
                                                <Text display={{ base: 'block', md: 'none' }} fontSize="xs" color="gray.500" fontWeight="normal">
                                                    Contact: {s.contactPerson}
                                                </Text>
                                            )}
                                        </Td>
                                        <Td display={{ base: 'none', md: 'table-cell' }}>{s.contactPerson || '-'}</Td>
                                        <Td>
                                            <VStack align="start" spacing={1}>
                                                {s.phone && <Text fontSize="sm" color="gray.600" display="flex" alignItems="center" gap={2}><Phone size={14} />{s.phone}</Text>}
                                                {s.email && <Text fontSize="sm" color="gray.600" display={{ base: 'none', sm: 'flex' }} alignItems="center" gap={2}><Mail size={14} />{s.email}</Text>}
                                            </VStack>
                                        </Td>
                                        <Td><Badge colorScheme={s.isActive ? 'green' : 'red'}>{s.isActive ? 'Active' : 'Inactive'}</Badge></Td>
                                        <Td textAlign="right">
                                            <HStack justify="flex-end" spacing={2}>
                                                <Tooltip label="Edit Supplier">
                                                    <IconButton icon={<Edit2 size={16} />} size="sm" variant="ghost" colorScheme="brand" onClick={() => handleOpenModal(s)} />
                                                </Tooltip>
                                                <Tooltip label="Delete Supplier">
                                                    <IconButton icon={<Trash2 size={16} />} size="sm" variant="ghost" colorScheme="red" onClick={() => handleDelete(s._id)} />
                                                </Tooltip>
                                            </HStack>
                                        </Td>
                                    </Tr>
                                ))}
                            </Tbody>
                        </Table>
                    )}
                </CardBody>
            </Card>

            <Modal isOpen={isOpen} onClose={onClose} size="lg">
                <ModalOverlay backdropFilter="blur(5px)" />
                <ModalContent borderRadius="2xl">
                    <ModalHeader>{editingId ? 'Edit Supplier' : 'Add Supplier'}</ModalHeader>
                    <ModalBody>
                        <VStack spacing={4}>
                            <FormControl isRequired>
                                <FormLabel>Supplier/Company Name</FormLabel>
                                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </FormControl>

                            <Flex gap={4} w="full" direction={{ base: 'column', md: 'row' }}>
                                <FormControl>
                                    <FormLabel>Contact Person</FormLabel>
                                    <Input value={formData.contactPerson} onChange={e => setFormData({ ...formData, contactPerson: e.target.value })} />
                                </FormControl>
                                <FormControl>
                                    <FormLabel>Phone</FormLabel>
                                    <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                </FormControl>
                            </Flex>

                            <Flex gap={4} w="full" direction={{ base: 'column', md: 'row' }}>
                                <FormControl>
                                    <FormLabel>Email</FormLabel>
                                    <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                </FormControl>
                                <FormControl>
                                    <FormLabel>Tax/GST ID</FormLabel>
                                    <Input value={formData.taxId} onChange={e => setFormData({ ...formData, taxId: e.target.value })} />
                                </FormControl>
                            </Flex>

                            <FormControl>
                                <FormLabel>Address</FormLabel>
                                <Input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                            </FormControl>

                            <FormControl display="flex" alignItems="center">
                                <FormLabel mb="0">Active Supplier?</FormLabel>
                                <Switch isChecked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} colorScheme="brand" />
                            </FormControl>
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
                        <Button colorScheme="brand" onClick={handleSave}>Save</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    );
}
