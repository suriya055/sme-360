import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Card,
    CardBody,
    Flex,
    Heading,
    Input,
    InputGroup,
    InputLeftElement,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Badge,
    IconButton,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    ModalCloseButton,
    FormControl,
    FormLabel,
    Select,
    Switch,
    useDisclosure,
    useToast,
    Text,
    VStack,
    HStack,
    Avatar,
    Stat,
    StatLabel,
    StatNumber,
    SimpleGrid
} from '@chakra-ui/react';
import { Search, UserPlus, MoreVertical, Edit2, Trash2, Lock, Users, Shield, DollarSign } from 'lucide-react';
import { userAPI } from '../services/api';
import { useApp } from '../hooks/useApp';

const roleColors = {
    admin: 'purple',
    manager: 'blue',
    cashier: 'green'
};

const roleIcons = {
    admin: Shield,
    manager: Users,
    cashier: DollarSign
};

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'cashier'
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: ''
    });

    const { isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose } = useDisclosure();
    const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
    const { isOpen: isPasswordOpen, onOpen: onPasswordOpen, onClose: onPasswordClose } = useDisclosure();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const toast = useToast();

    // Get current user to check permissions during actions
    const { user: currentUser } = useApp();

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        const u = users || [];
        if (searchTerm) {
            setFilteredUsers(u.filter(user => {
                const search = searchTerm.toLowerCase();
                return (
                    (user?.name || "").toLowerCase().includes(search) ||
                    (user?.email || "").toLowerCase().includes(search) ||
                    (user?.role || "").toLowerCase().includes(search)
                );
            }));
        } else {
            setFilteredUsers(u);
        }
    }, [searchTerm, users]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await userAPI.getAll();
            const userData = Array.isArray(response.data) ? response.data : [];
            setUsers(userData);
        } catch (err) {
            setError(err.message);
            setUsers([]);
            toast({
                title: 'Error fetching users',
                description: err.response?.data?.message || err.message || 'Connection failed',
                status: 'error',
                duration: 5000
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAddUser = async () => {
        try {
            await userAPI.create(formData);
            toast({
                title: 'User created successfully',
                status: 'success',
                duration: 2000
            });
            fetchUsers();
            onAddClose();
            fetchUsers();
            onAddClose();
            setFormData({ name: '', email: '', phone: '', password: '', role: 'cashier' });
        } catch (error) {
            toast({
                title: 'Error creating user',
                description: error.response?.data?.message || 'Please try again',
                status: 'error',
                duration: 3000
            });
        }
    };

    const handleEditUser = async () => {
        try {
            await userAPI.update(selectedUser._id, {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                role: formData.role
            });
            toast({
                title: 'User updated successfully',
                status: 'success',
                duration: 2000
            });
            fetchUsers();
            onEditClose();
        } catch (error) {
            toast({
                title: 'Error updating user',
                description: error.response?.data?.message || 'Please try again',
                status: 'error',
                duration: 3000
            });
        }
    };

    const handleDeleteUser = async (userId) => {
        // Find target user to check role
        const targetUser = users.find(u => u._id === userId);

        // Restriction: Manager cannot delete Admin
        if (currentUser?.role === 'manager' && targetUser?.role === 'admin') {
            toast({
                title: 'Restricted Activity',
                description: 'Managers cannot remove Administrators.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await userAPI.delete(userId);
                toast({
                    title: 'User deleted successfully',
                    status: 'success',
                    duration: 2000
                });
                fetchUsers();
            } catch (error) {
                toast({
                    title: 'Error deleting user',
                    description: error.response?.data?.message || 'Please try again',
                    status: 'error',
                    duration: 3000
                });
            }
        }
    };

    const handleToggleStatus = async (userId) => {
        try {
            await userAPI.toggleStatus(userId);
            toast({
                title: 'User status updated',
                status: 'success',
                duration: 2000
            });
            fetchUsers();
        } catch (error) {
            toast({
                title: 'Error updating status',
                description: error.response?.data?.message || 'Please try again',
                status: 'error',
                duration: 3000
            });
        }
    };

    const handleChangePassword = async () => {
        try {
            await userAPI.changePassword(selectedUser._id, passwordData);
            toast({
                title: 'Password changed successfully',
                status: 'success',
                duration: 2000
            });
            onPasswordClose();
            setPasswordData({ currentPassword: '', newPassword: '' });
        } catch (error) {
            toast({
                title: 'Error changing password',
                description: error.response?.data?.message || 'Please try again',
                status: 'error',
                duration: 3000
            });
        }
    };

    const openEditModal = (user) => {
        setSelectedUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            role: user.role
        });
        onEditOpen();
    };

    const openPasswordModal = (user) => {
        setSelectedUser(user);
        setPasswordData({ currentPassword: '', newPassword: '' });
        onPasswordOpen();
    };

    const stats = {
        total: users.length,
        admins: users.filter(u => u.role === 'admin').length,
        managers: users.filter(u => u.role === 'manager').length,
        cashiers: users.filter(u => u.role === 'cashier').length
    };

    if (loading) {
        return (
            <Flex h="80vh" align="center" justify="center" direction="column" gap={4}>
                <HStack spacing={4}>
                    <Text fontSize="xl" color="gray.500">Loading User System...</Text>
                </HStack>
                <Text fontSize="sm" color="gray.400">Please wait while we connect to the server</Text>
            </Flex>
        );
    }

    if (error) {
        return (
            <Flex h="80vh" align="center" justify="center" direction="column" gap={4}>
                <Heading size="md" color="red.500">System Error</Heading>
                <Text color="gray.600">{error}</Text>
                <Button colorScheme="brand" onClick={fetchUsers} leftIcon={<Search size={16} />}>
                    Retry Connection
                </Button>
            </Flex>
        );
    }

    return (
        <Box p={8}>
            <Flex justify="space-between" align="center" mb={6} direction={{ base: 'column', md: 'row' }} gap={4}>
                <Heading size="lg">User Management</Heading>
                <Button leftIcon={<UserPlus size={20} />} colorScheme="brand" onClick={onAddOpen} w={{ base: 'full', md: 'auto' }}>
                    Add New User
                </Button>
            </Flex>

            {/* Stats */}
            <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4} mb={6}>
                <Card>
                    <CardBody>
                        <Stat>
                            <StatLabel>Total Users</StatLabel>
                            <StatNumber>{stats.total}</StatNumber>
                        </Stat>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody>
                        <Stat>
                            <StatLabel>Admins</StatLabel>
                            <StatNumber color="purple.500">{stats.admins}</StatNumber>
                        </Stat>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody>
                        <Stat>
                            <StatLabel>Managers</StatLabel>
                            <StatNumber color="blue.500">{stats.managers}</StatNumber>
                        </Stat>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody>
                        <Stat>
                            <StatLabel>Cashiers</StatLabel>
                            <StatNumber color="green.500">{stats.cashiers}</StatNumber>
                        </Stat>
                    </CardBody>
                </Card>
            </SimpleGrid>

            {/* Search */}
            <Card mb={4}>
                <CardBody>
                    <InputGroup>
                        <InputLeftElement>
                            <Search size={20} />
                        </InputLeftElement>
                        <Input
                            placeholder="Search users by name, email, or role..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </InputGroup>
                </CardBody>
            </Card>

            {/* Users Table */}
            <Card>
                <CardBody overflowX="auto">
                    <Table variant="simple" minW="600px">
                        <Thead>
                            <Tr>
                                <Th>User</Th>
                                <Th>Email</Th>
                                <Th>Phone</Th>
                                <Th>Role</Th>
                                <Th>Status</Th>
                                <Th>Created</Th>
                                <Th>Actions</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {filteredUsers.map((user) => {
                                const RoleIcon = roleIcons[user.role] || Shield;
                                return (
                                    <Tr key={user._id}>
                                        <Td>
                                            <HStack>
                                                <Avatar name={user.name} size="sm" />
                                                <Text fontWeight="medium">{user.name}</Text>
                                            </HStack>
                                        </Td>
                                        <Td>{user.email}</Td>
                                        <Td>{user.phone || '-'}</Td>
                                        <Td>
                                            <Badge colorScheme={roleColors[user.role] || 'gray'} display="flex" alignItems="center" gap={1} w="fit-content">
                                                <RoleIcon size={12} />
                                                {user.role ? user.role.toUpperCase() : 'UNKNOWN'}
                                            </Badge>
                                        </Td>
                                        <Td>
                                            <Badge colorScheme={user.isActive ? 'green' : 'red'}>
                                                {user.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </Td>
                                        <Td>{new Date(user.createdAt).toLocaleDateString()}</Td>
                                        <Td>
                                            <Menu>
                                                <MenuButton as={IconButton} icon={<MoreVertical size={16} />} variant="ghost" size="sm" />
                                                <MenuList>
                                                    <MenuItem icon={<Edit2 size={16} />} onClick={() => openEditModal(user)}>
                                                        Edit User
                                                    </MenuItem>
                                                    <MenuItem icon={<Lock size={16} />} onClick={() => openPasswordModal(user)}>
                                                        Change Password
                                                    </MenuItem>
                                                    <MenuItem onClick={() => handleToggleStatus(user._id)}>
                                                        {user.isActive ? 'Deactivate' : 'Activate'}
                                                    </MenuItem>
                                                    <MenuItem icon={<Trash2 size={16} />} color="red.500" onClick={() => handleDeleteUser(user._id)}>
                                                        Delete User
                                                    </MenuItem>
                                                </MenuList>
                                            </Menu>
                                        </Td>
                                    </Tr>
                                );
                            })}
                        </Tbody>
                    </Table>
                </CardBody>
            </Card>

            {/* Add User Modal */}
            <Modal isOpen={isAddOpen} onClose={onAddClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Add New User</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4}>
                            <FormControl isRequired>
                                <FormLabel>Full Name</FormLabel>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="John Doe"
                                />
                            </FormControl>
                            <FormControl isRequired>
                                <FormLabel>Email</FormLabel>
                                <Input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="john@example.com"
                                />
                            </FormControl>
                            <FormControl isRequired>
                                <FormLabel>Role</FormLabel>
                                <Select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="cashier">Cashier</option>
                                    <option value="manager">Manager</option>
                                    <option value="admin">Admin</option>
                                </Select>
                            </FormControl>

                            <FormControl isRequired={['admin', 'manager'].includes(formData.role)}>
                                <FormLabel>
                                    WhatsApp Phone Number
                                    {['admin', 'manager'].includes(formData.role) && (
                                        <Text as="span" color="red.500" ml={1} fontSize="xs">
                                            ⚠️ Required for WhatsApp Admin Access
                                        </Text>
                                    )}
                                </FormLabel>
                                <Input
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="e.g. 919025980641 (with country code, no + or spaces)"
                                />
                                <Text fontSize="xs" color="gray.500" mt={1}>
                                    This number must match the WhatsApp number they message from.
                                </Text>
                            </FormControl>
                            <FormControl isRequired>
                                <FormLabel>Password</FormLabel>
                                <Input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="Minimum 6 characters"
                                />
                            </FormControl>
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onAddClose}>
                            Cancel
                        </Button>
                        <Button colorScheme="brand" onClick={handleAddUser}>
                            Create User
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Edit User Modal */}
            <Modal isOpen={isEditOpen} onClose={onEditClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Edit User</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4}>
                            <FormControl isRequired>
                                <FormLabel>Full Name</FormLabel>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </FormControl>
                            <FormControl isRequired>
                                <FormLabel>Email</FormLabel>
                                <Input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </FormControl>
                            <FormControl isRequired>
                                <FormLabel>Role</FormLabel>
                                <Select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    isDisabled={currentUser?.role === 'manager'}
                                >
                                    <option value="cashier">Cashier</option>
                                    <option value="manager">Manager</option>
                                    <option value="admin">Admin</option>
                                </Select>
                            </FormControl>

                            <FormControl isRequired={['admin', 'manager'].includes(formData.role)}>
                                <FormLabel>
                                    WhatsApp Phone Number
                                    {['admin', 'manager'].includes(formData.role) && (
                                        <Text as="span" color="red.500" ml={1} fontSize="xs">
                                            ⚠️ Required for WhatsApp Admin Access
                                        </Text>
                                    )}
                                </FormLabel>
                                <Input
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="e.g. 919025980641 (with country code, no + or spaces)"
                                />
                                <Text fontSize="xs" color="gray.500" mt={1}>
                                    This must match the WhatsApp number they message from.
                                </Text>
                            </FormControl>
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onEditClose}>
                            Cancel
                        </Button>
                        <Button colorScheme="brand" onClick={handleEditUser}>
                            Update User
                        </Button>
                    </ModalFooter>
                </ModalContent >
            </Modal >

            {/* Change Password Modal */}
            < Modal isOpen={isPasswordOpen} onClose={onPasswordClose} >
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Change Password</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4}>
                            <FormControl isRequired>
                                <FormLabel>Current Password</FormLabel>
                                <Input
                                    type="password"
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                />
                            </FormControl>
                            <FormControl isRequired>
                                <FormLabel>New Password</FormLabel>
                                <Input
                                    type="password"
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                    placeholder="Minimum 6 characters"
                                />
                            </FormControl>
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onPasswordClose}>
                            Cancel
                        </Button>
                        <Button colorScheme="brand" onClick={handleChangePassword}>
                            Change Password
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal >
        </Box >
    );
}
