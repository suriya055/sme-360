import React, { useState, useEffect, useRef } from 'react';
import {
    Box, IconButton, Flex, Text, Input, Button, VStack,
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody,
    ModalFooter, useDisclosure, Badge, Avatar, useColorModeValue, ModalCloseButton
} from '@chakra-ui/react';
import { MessageSquare, X, Send, User } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../hooks/useApp';
import { queryAPI } from '../services/api';
import { format } from 'date-fns';

const ChatWidget = ({ placement = 'floating', display }) => {
    const { user, isAuthenticated } = useApp();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [activeQuery, setActiveQuery] = useState(null);
    const [loading, setLoading] = useState(false);
    const [posBottomOffsetPx, setPosBottomOffsetPx] = useState(92);
    const messagesEndRef = useRef(null);

    // Custom Hook Logic inside component for simplicity in this specific task
    // In a real app, this logic would be in a Context or separate hook

    const bg = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const location = useLocation();
    const pathname = location?.pathname || '';
    const isPOS = pathname === '/pos' || pathname.startsWith('/pos/');

    useEffect(() => {
        if (placement !== 'floating') return;
        if (!isPOS) return;

        const compute = () => {
            const el = document.getElementById('pos-mobile-bottom-bar');
            // Add a little spacing above the POS bar.
            if (el) {
                const h = Math.max(0, Math.round(el.getBoundingClientRect().height));
                setPosBottomOffsetPx(h + 12);
            } else {
                setPosBottomOffsetPx(92);
            }
        };

        // Run now and again after layout settles.
        compute();
        const raf = window.requestAnimationFrame(compute);

        window.addEventListener('resize', compute);
        // visualViewport helps on mobile when browser UI appears/disappears.
        window.visualViewport?.addEventListener('resize', compute);

        return () => {
            window.cancelAnimationFrame(raf);
            window.removeEventListener('resize', compute);
            window.visualViewport?.removeEventListener('resize', compute);
        };
    }, [isPOS]);

    // POS has a fixed bottom bar on mobile; lift the chat button above it so it doesn't cover totals/actions.
    const baseBottom = isPOS
        ? `calc(env(safe-area-inset-bottom) + ${posBottomOffsetPx}px)`
        : 'calc(env(safe-area-inset-bottom) + 12px)';

    useEffect(() => {
        if (isOpen && user) {
            // Fetch active query for this customer
            fetchActiveQuery();
        }
    }, [isOpen, user]);

    useEffect(() => {
        if (activeQuery) {
            const interval = setInterval(() => {
                refreshMessages();
            }, 5000); // Poll every 5s
            return () => clearInterval(interval);
        }
    }, [activeQuery]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchActiveQuery = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Find open query for this customer (Basic logic: find first open one)
            // Ideally API should support /queries/active
            const res = await queryAPI.getAll({ customerId: user._id, status: 'open' });
            if (res.data && res.data.length > 0) {
                const query = res.data[0];
                setActiveQuery(query);
                const msgRes = await queryAPI.getById(query._id);
                setMessages(msgRes.data.messages);
            } else {
                // No active query, show empty or welcome
                setActiveQuery(null);
                setMessages([]);
            }
        } catch (error) {
            console.error("Chat load error", error);
        } finally {
            setLoading(false);
        }
    };

    const refreshMessages = async () => {
        if (!activeQuery) return;
        try {
            const res = await queryAPI.getById(activeQuery._id);
            setMessages(res.data.messages);
        } catch (error) {
            console.error("Poll error", error);
        }
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        try {
            if (activeQuery) {
                // Reply to existing
                await queryAPI.reply(activeQuery._id, {
                    content: input,
                    sender: 'customer'
                });
                await refreshMessages();
            } else {
                // Create new query (Optional feature, for now allow if user is logged in)
                // For simplicity, we might force them to contact admin via phone/email if no active query exists 
                // OR we create a new one. Let's create a new one.
                if (!user) return; // Must be logged in

                const res = await queryAPI.create({
                    customerId: user._id, // Self
                    subject: 'New Support Request',
                    content: input,
                    priority: 'medium',
                    platform: 'web'
                });
                setActiveQuery(res.data.query);
                setMessages([res.data.message]); // Initial message
            }
            setInput('');
        } catch (error) {
            console.error("Send error", error);
        }
    };

    // if (!isAuthenticated || (user?.role === 'admin' || user?.role === 'manager' || user?.role === 'cashier')) {
    //     return null;
    // }

    if (!isAuthenticated) return null;

    const renderChatBody = () => (
        <>
            {/* Messages */}
            <Box flex="1" overflowY="auto" p={{ base: 3, sm: 4 }} bg={useColorModeValue('gray.50', 'gray.900')}>
                {messages.length === 0 ? (
                    <Flex h="full" align="center" justify="center" direction="column" color="gray.400">
                        <MessageSquare size={32} opacity={0.5} />
                        <Text fontSize="sm" mt={2}>How can we help you?</Text>
                    </Flex>
                ) : (
                    <VStack spacing={3} align="stretch">
                        {messages.map((msg, i) => (
                            <Flex key={i} justify={msg.sender === 'customer' ? 'flex-end' : 'flex-start'}>
                                <Box
                                    maxW="80%"
                                    bg={msg.sender === 'customer' ? 'brand.500' : 'white'}
                                    color={msg.sender === 'customer' ? 'white' : 'gray.800'}
                                    p={2}
                                    px={3}
                                    borderRadius="lg"
                                    shadow="sm"
                                >
                                    <Text fontSize="sm">{msg.content}</Text>
                                </Box>
                            </Flex>
                        ))}
                        <div ref={messagesEndRef} />
                    </VStack>
                )}
            </Box>

            {/* Input */}
            <Box p={{ base: 2.5, sm: 3 }} borderTopWidth="1px" bg={useColorModeValue('white', 'gray.800')}>
                <Flex gap={2}>
                    <Input
                        placeholder="Type a message..."
                        size="sm"
                        borderRadius="full"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <IconButton
                        size="sm"
                        colorScheme="brand"
                        icon={<Send size={16} />}
                        isRound
                        onClick={handleSend}
                        isDisabled={!input.trim()}
                        aria-label="Send message"
                    />
                </Flex>
            </Box>
        </>
    );

    const launcher = (
        <IconButton
            icon={<MessageSquare size={22} />}
            isRound={placement === 'floating'}
            size={{ base: 'md', sm: 'lg' }}
            colorScheme="brand"
            variant={placement === 'floating' ? 'solid' : 'ghost'}
            shadow={placement === 'floating' ? 'lg' : 'none'}
            onClick={() => setIsOpen(true)}
            aria-label="Open support chat"
        />
    );

    if (placement === 'header') {
        return (
            <Box display={display}>
                {launcher}
                <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size={{ base: 'full', sm: 'md' }} isCentered>
                    <ModalOverlay backdropFilter="blur(6px)" />
                    <ModalContent borderRadius={{ base: 0, sm: 'xl' }} overflow="hidden" bg={bg} borderWidth="1px" borderColor={borderColor}>
                        <ModalHeader bg="brand.600" color="white" py={4}>
                            <Flex align="center" gap={2}>
                                <Avatar size="xs" src={null} bg="whiteAlpha.300" icon={<User size={16} />} />
                                <Text fontWeight="bold">Support Chat</Text>
                            </Flex>
                        </ModalHeader>
                        <ModalCloseButton color="white" _hover={{ bg: 'whiteAlpha.200' }} />
                        <ModalBody p={0} display="flex" flexDirection="column" h={{ base: 'calc(100vh - 72px)', sm: '450px' }}>
                            {renderChatBody()}
                        </ModalBody>
                    </ModalContent>
                </Modal>
            </Box>
        );
    }

    return (
        <Box
            position="fixed"
            bottom={{ base: baseBottom, sm: '20px' }}
            right={{ base: '12px', sm: '20px' }}
            left={{ base: 'auto', sm: 'auto' }}
            zIndex={1000}
            display={display || 'flex'}
            justifyContent="flex-end"
        >
            {launcher}
            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size={{ base: 'full', sm: 'md' }} isCentered>
                <ModalOverlay backdropFilter="blur(6px)" />
                <ModalContent borderRadius={{ base: 0, sm: 'xl' }} overflow="hidden" bg={bg} borderWidth="1px" borderColor={borderColor}>
                    <ModalHeader bg="brand.600" color="white" py={4}>
                        <Flex align="center" gap={2}>
                            <Avatar size="xs" src={null} bg="whiteAlpha.300" icon={<User size={16} />} />
                            <Text fontWeight="bold">Support Chat</Text>
                        </Flex>
                    </ModalHeader>
                    <ModalCloseButton color="white" _hover={{ bg: 'whiteAlpha.200' }} />
                    <ModalBody p={0} display="flex" flexDirection="column" h={{ base: 'calc(100vh - 72px)', sm: '450px' }}>
                        {renderChatBody()}
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Box>
    );
};

export default ChatWidget;
