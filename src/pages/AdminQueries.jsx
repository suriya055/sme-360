import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Flex, Heading, Text, Button, Table, Thead, Tbody, Tr, Th, Td,
    Badge, Input, Textarea, Avatar, VStack, HStack, Card, CardBody,
    useToast, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody,
    ModalFooter, useDisclosure, Select, IconButton, Spinner, Divider
} from '@chakra-ui/react';
import { MessageSquare, Send, User, CheckCircle, Clock, XCircle, Search, RefreshCw } from 'lucide-react';
import { queryAPI, customerAPI } from '../services/api';
import { useApp } from '../hooks/useApp';
import { format } from 'date-fns';

export default function AdminQueries() {
    const { user } = useApp();
    const [queries, setQueries] = useState([]);
    const [selectedQuery, setSelectedQuery] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [replyContent, setReplyContent] = useState('');
    const [isSending, setIsSending] = useState(false);
    const toast = useToast();
    const messagesEndRef = useRef(null);

    // New Query State
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [customers, setCustomers] = useState([]);
    const [newQueryData, setNewQueryData] = useState({
        customerId: '',
        subject: '',
        content: '',
        priority: 'medium',
        platform: 'web'
    });

    const fetchQueries = async () => {
        try {
            const res = await queryAPI.getAll();
            setQueries(res.data);
        } catch (error) {
            console.error(error);
            toast({ title: 'Failed to load queries', status: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQueries();
    }, []);

    useEffect(() => {
        if (selectedQuery) {
            const loadMessages = async () => {
                try {
                    const res = await queryAPI.getById(selectedQuery._id);
                    setMessages(res.data.messages);
                } catch (error) {
                    console.error(error);
                }
            };
            loadMessages();
            // Poll for new messages every 5 seconds when a chat is open
            const interval = setInterval(loadMessages, 5000);
            return () => clearInterval(interval);
        }
    }, [selectedQuery]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleCreateQuery = async () => {
        try {
            if (!newQueryData.customerId || !newQueryData.subject || !newQueryData.content) {
                toast({ title: 'Please fill all required fields', status: 'warning' });
                return;
            }
            setIsSending(true);
            await queryAPI.create(newQueryData);
            toast({ title: 'Query created & sent', status: 'success' });
            onClose();
            fetchQueries();
            setNewQueryData({ customerId: '', subject: '', content: '', priority: 'medium', platform: 'web' });
        } catch (error) {
            toast({ title: 'Failed to create query', status: 'error' });
        } finally {
            setIsSending(false);
        }
    };

    const handleReply = async () => {
        if (!replyContent.trim()) return;
        try {
            setIsSending(true);
            const res = await queryAPI.reply(selectedQuery._id, {
                content: replyContent,
                sender: 'admin'
            });
            setMessages([...messages, res.data]);
            setReplyContent('');
            // Refresh query list to update timestamp
            fetchQueries();
        } catch (error) {
            toast({ title: 'Failed to send reply', status: 'error' });
        } finally {
            setIsSending(false);
        }
    };

    const handleStatusUpdate = async (status) => {
        try {
            await queryAPI.updateStatus(selectedQuery._id, status);
            setSelectedQuery(prev => ({ ...prev, status }));
            fetchQueries();
            toast({ title: `Ticket ${status}`, status: 'info' });
        } catch (error) {
            toast({ title: 'Failed to update status', status: 'error' });
        }
    };

    const loadCustomers = async () => {
        try {
            const res = await customerAPI.getAll();
            setCustomers(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const openCreateModal = () => {
        loadCustomers();
        onOpen();
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'open': return 'green';
            case 'pending': return 'orange';
            case 'closed': return 'gray';
            default: return 'gray';
        }
    };

    return (
        <Flex
            h={{ base: 'auto', lg: 'calc(100vh - 100px)' }}
            gap={6}
            direction={{ base: 'column', lg: 'row' }}
        >
            {/* List Section */}
            <Box
                w={{ base: '100%', lg: '35%' }}
                bg="white"
                borderRadius="2xl"
                shadow="sm"
                border="1px solid"
                borderColor="gray.100"
                display="flex"
                flexDirection="column"
                maxH={{ base: '50vh', lg: '100%' }}
            >
                <Flex justify="space-between" align="center" p={5} borderBottom="1px solid" borderColor="gray.100">
                    <Heading size="md" color="gray.800" fontWeight="700">Queries</Heading>
                    <Button size="sm" colorScheme="brand" borderRadius="full" leftIcon={<MessageSquare size={16} />} onClick={openCreateModal}>
                        <Box as="span" display={{ base: 'none', md: 'inline' }}>New Query</Box>
                    </Button>
                </Flex>

                <Box flex="1" overflowY="auto" p={3} bg="gray.50" borderBottomRadius="2xl">
                    {loading ? (
                        <Flex justify="center" py={10}><Spinner color="brand.500" size="xl" /></Flex>
                    ) : queries.length === 0 ? (
                        <Flex justify="center" align="center" direction="column" py={10} color="gray.400">
                            <MessageSquare size={32} />
                            <Text mt={3} fontSize="sm">No queries found</Text>
                        </Flex>
                    ) : (
                        <VStack spacing={3} align="stretch">
                            {queries.map(q => (
                                <Box
                                    key={q._id}
                                    p={4}
                                    borderRadius="xl"
                                    cursor="pointer"
                                    bg={selectedQuery?._id === q._id ? 'brand.50' : 'white'}
                                    borderWidth="1px"
                                    borderColor={selectedQuery?._id === q._id ? 'brand.200' : 'gray.100'}
                                    boxShadow={selectedQuery?._id === q._id ? 'sm' : 'sm'}
                                    _hover={{ bg: selectedQuery?._id === q._id ? 'brand.50' : 'gray.50', borderColor: 'brand.100', transform: 'translateY(-1px)' }}
                                    transition="all 0.2s"
                                    onClick={() => setSelectedQuery(q)}
                                >
                                    <Flex align="start" gap={3}>
                                        <Avatar size="sm" name={q.customer?.name || 'Unknown'} bg={selectedQuery?._id === q._id ? 'brand.500' : 'gray.400'} color="white" />
                                        <Box flex="1">
                                            <Flex justify="space-between" align="center" mb={1}>
                                                <Text fontWeight="bold" fontSize="sm" color="gray.800" noOfLines={1}>{q.subject}</Text>
                                                <Text fontSize="xs" color="gray.400" fontWeight="500">
                                                    {format(new Date(q.lastMessageAt || q.createdAt), 'HH:mm')}
                                                </Text>
                                            </Flex>
                                            <Text fontSize="xs" color="gray.500" noOfLines={1} mb={3}>
                                                {q.customer?.name || 'Unknown User'}
                                            </Text>
                                            <Flex justify="space-between" align="center">
                                                <HStack spacing={2}>
                                                    <Badge colorScheme={getStatusColor(q.status)} fontSize="2xs" borderRadius="full" px={2} textTransform="uppercase">{q.status}</Badge>
                                                    <Badge variant="subtle" fontSize="2xs" borderRadius="full" px={2} colorScheme={q.platform === 'whatsapp' ? 'whatsapp' : 'gray'}>{q.platform}</Badge>
                                                </HStack>
                                            </Flex>
                                        </Box>
                                    </Flex>
                                </Box>
                            ))}
                        </VStack>
                    )}
                </Box>
            </Box>

            {/* Chat Section */}
            <Box
                w={{ base: '100%', lg: '65%' }}
                bg="white"
                borderRadius="2xl"
                shadow="sm"
                border="1px solid"
                borderColor="gray.100"
                display="flex"
                flexDirection="column"
                minH={{ base: '60vh', lg: 'auto' }}
            >
                {selectedQuery ? (
                    <>
                        {/* Chat Header */}
                        <Box p={4} px={6} borderBottomWidth="1px" borderColor="gray.100" bg="white" borderTopRadius="2xl">
                            <Flex justify="space-between" align="center">
                                <HStack spacing={4}>
                                    <Avatar size="md" name={selectedQuery.customer?.name || 'Unknown'} bg="brand.500" color="white" />
                                    <Box>
                                        <Heading size="sm" color="gray.800" mb={1}>{selectedQuery.subject}</Heading>
                                        <Text fontSize="xs" color="gray.500">
                                            <Box as="span" fontWeight="600" color="gray.700">{selectedQuery.customer?.name || 'Unknown'}</Box> • Priority: <Badge colorScheme={selectedQuery.priority === 'high' ? 'red' : 'green'} fontSize="3xs" borderRadius="full" px={2}>{selectedQuery.priority.toUpperCase()}</Badge>
                                        </Text>
                                    </Box>
                                </HStack>
                                <HStack>
                                    {selectedQuery.status !== 'closed' ? (
                                        <Button size="sm" colorScheme="gray" variant="outline" borderRadius="full" onClick={() => handleStatusUpdate('closed')}>
                                            Mark as Resolved
                                        </Button>
                                    ) : (
                                        <Button size="sm" colorScheme="green" variant="outline" borderRadius="full" onClick={() => handleStatusUpdate('open')}>
                                            Re-open Ticket
                                        </Button>
                                    )}
                                </HStack>
                            </Flex>
                        </Box>

                        {/* Chat Messages */}
                        <Box flex="1" overflowY="auto" p={{ base: 4, sm: 6 }} bg="gray.50">
                            <VStack spacing={4} align="stretch">
                                {messages.map((msg, idx) => (
                                    <Flex key={idx} justify={msg.sender === 'admin' ? 'flex-end' : 'flex-start'}>
                                        <Box
                                            maxW={{ base: '85%', md: '70%' }}
                                            bg={msg.sender === 'admin' ? 'brand.500' : 'white'}
                                            color={msg.sender === 'admin' ? 'white' : 'gray.800'}
                                            p={3}
                                            px={4}
                                            borderTopLeftRadius="2xl"
                                            borderTopRightRadius="2xl"
                                            borderBottomLeftRadius={msg.sender === 'admin' ? '2xl' : 'sm'}
                                            borderBottomRightRadius={msg.sender === 'admin' ? 'sm' : '2xl'}
                                            boxShadow="sm"
                                            borderWidth={msg.sender === 'admin' ? '0' : '1px'}
                                            borderColor="gray.100"
                                        >
                                            <Text fontSize="sm" lineHeight="tall">{msg.content}</Text>
                                            <Text 
                                                fontSize="xs" 
                                                textAlign="right" 
                                                opacity={msg.sender === 'admin' ? 0.8 : 0.5} 
                                                mt={1} 
                                                fontWeight="500"
                                            >
                                                {format(new Date(msg.timestamp), 'HH:mm')}
                                            </Text>
                                        </Box>
                                    </Flex>
                                ))}
                                <div ref={messagesEndRef} />
                            </VStack>
                        </Box>

                        {/* Chat Input */}
                        <Box p={4} bg="white" borderTopWidth="1px" borderColor="gray.100" borderBottomRadius="2xl">
                            <form onSubmit={(e) => { e.preventDefault(); handleReply(); }}>
                                <HStack spacing={3}>
                                    <Input
                                        value={replyContent}
                                        onChange={(e) => setReplyContent(e.target.value)}
                                        placeholder="Type your reply..."
                                        bg="gray.50"
                                        border="0"
                                        _focus={{ bg: 'white', border: '1px solid', borderColor: 'brand.500', boxShadow: 'none' }}
                                        borderWidth="1px"
                                        borderColor="transparent"
                                        borderRadius="full"
                                        px={6}
                                        py={6}
                                        isDisabled={selectedQuery.status === 'closed'}
                                    />
                                    <IconButton
                                        type="submit"
                                        colorScheme="brand"
                                        icon={<Send size={20} />}
                                        isLoading={isSending}
                                        borderRadius="full"
                                        size="lg"
                                        w="52px"
                                        isDisabled={!replyContent.trim() || selectedQuery.status === 'closed'}
                                    />
                                </HStack>
                                {selectedQuery.status === 'closed' && (
                                    <Text fontSize="xs" color="gray.400" mt={2} textAlign="center">
                                        This ticket is closed. Re-open it to continue the conversation.
                                    </Text>
                                )}
                            </form>
                        </Box>
                    </>
                ) : (
                    <Flex flex="1" align="center" justify="center" direction="column" color="gray.400" bg="gray.50" borderRadius="2xl">
                        <Box p={6} bg="white" borderRadius="full" shadow="sm" mb={6}>
                            <MessageSquare size={48} color="#cbd5e1" />
                        </Box>
                        <Heading size="md" color="gray.500" mb={2} fontWeight="600">No Chat Selected</Heading>
                        <Text fontSize="sm" color="gray.400">Choose a query from the list to start conversing.</Text>
                    </Flex>
                )}
            </Box>

            {/* Create Modal */}
            <Modal isOpen={isOpen} onClose={onClose} size="lg">
                <ModalOverlay backdropFilter="blur(4px)" />
                <ModalContent borderRadius="2xl">
                    <ModalHeader color="gray.800">Create New Query</ModalHeader>
                    <ModalBody>
                        <VStack spacing={5}>
                            <Box w="full">
                                <Text fontSize="sm" fontWeight="600" color="gray.700" mb={1}>Customer</Text>
                                <Select 
                                    placeholder="Select Customer" 
                                    onChange={(e) => setNewQueryData({ ...newQueryData, customerId: e.target.value })}
                                    bg="gray.50"
                                    border="0"
                                    _focus={{ bg: 'white', border: '1px solid', borderColor: 'brand.500' }}
                                >
                                    {customers.map(c => (
                                        <option key={c._id} value={c._id}>{c.name} ({c.email || c.phone})</option>
                                    ))}
                                </Select>
                            </Box>
                            <Box w="full">
                                <Text fontSize="sm" fontWeight="600" color="gray.700" mb={1}>Subject</Text>
                                <Input
                                    placeholder="Brief summary of the issue"
                                    value={newQueryData.subject}
                                    onChange={(e) => setNewQueryData({ ...newQueryData, subject: e.target.value })}
                                    bg="gray.50"
                                    border="0"
                                    _focus={{ bg: 'white', border: '1px solid', borderColor: 'brand.500' }}
                                />
                            </Box>
                            <Box w="full">
                                <Text fontSize="sm" fontWeight="600" color="gray.700" mb={1}>Message</Text>
                                <Textarea
                                    placeholder="Detailed message description"
                                    value={newQueryData.content}
                                    onChange={(e) => setNewQueryData({ ...newQueryData, content: e.target.value })}
                                    rows={4}
                                    bg="gray.50"
                                    border="0"
                                    _focus={{ bg: 'white', border: '1px solid', borderColor: 'brand.500' }}
                                />
                            </Box>
                            <Flex w="full" gap={4}>
                                <Box flex="1">
                                    <Text fontSize="sm" fontWeight="600" color="gray.700" mb={1}>Priority</Text>
                                    <Select value={newQueryData.priority} onChange={(e) => setNewQueryData({ ...newQueryData, priority: e.target.value })} bg="gray.50" border="0">
                                        <option value="low">Low Priority</option>
                                        <option value="medium">Medium Priority</option>
                                        <option value="high">High Priority</option>
                                    </Select>
                                </Box>
                                <Box flex="1">
                                    <Text fontSize="sm" fontWeight="600" color="gray.700" mb={1}>Platform</Text>
                                    <Select value={newQueryData.platform} onChange={(e) => setNewQueryData({ ...newQueryData, platform: e.target.value })} bg="gray.50" border="0">
                                        <option value="web">Web Only</option>
                                        <option value="whatsapp">WhatsApp</option>
                                    </Select>
                                </Box>
                            </Flex>
                        </VStack>
                    </ModalBody>
                    <ModalFooter borderTopWidth="1px" borderColor="gray.100" mt={4} pt={4}>
                        <Button variant="ghost" mr={3} onClick={onClose} borderRadius="full">Cancel</Button>
                        <Button colorScheme="brand" onClick={handleCreateQuery} isLoading={isSending} borderRadius="full" px={6}>Create Ticket</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Flex>
    );
}

