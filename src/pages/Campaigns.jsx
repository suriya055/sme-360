import React, { useState, useEffect } from 'react';
import {
    Box, Flex, Text, VStack, HStack, Badge, Button, Select,
    Heading, Card, CardBody, useDisclosure, Modal, ModalOverlay, ModalContent,
    ModalHeader, ModalBody, ModalFooter, FormControl, FormLabel, Input,
    Textarea, Checkbox, CheckboxGroup, Alert, AlertIcon, SimpleGrid, Spinner
} from '@chakra-ui/react';
import { Send, Users, Smartphone, Clock, XCircle, AlertCircle } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function Campaigns() {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [name, setName] = useState('');
    const [type, setType] = useState('promotional'); // promotional or broadcast
    const [targetAll, setTargetAll] = useState(true);
    const [selectedTiers, setSelectedTiers] = useState(['Gold']);
    const [messageTemplate, setMessageTemplate] = useState('Hi {name}! You are our valued {tier} customer. Enjoy 10% off your next visit!');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchCampaigns = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/campaigns');
            setCampaigns(data);
        } catch (err) {
            toast.error('Failed to load campaigns');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const handleCreate = async () => {
        if (!name.trim() || !messageTemplate.trim()) {
            return toast.error('Name and Message are required');
        }

        setIsSubmitting(true);
        try {
            await api.post('/campaigns', {
                name,
                type,
                targetAudience: {
                    all: targetAll,
                    tiers: targetAll ? [] : selectedTiers,
                    tags: []
                },
                messageTemplate
            });
            toast.success('Campaign launched successfully');
            onClose();
            fetchCampaigns();
            // Reset form
            setName('');
            setMessageTemplate('');
            setTargetAll(true);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create campaign');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = async (id) => {
        if (!window.confirm('Are you sure you want to cancel this campaign?')) return;
        try {
            await api.post(`/campaigns/${id}/cancel`);
            toast.success('Campaign cancelled');
            fetchCampaigns();
        } catch (err) {
            toast.error('Failed to cancel campaign');
        }
    };

    const statusColors = {
        draft: 'gray',
        scheduled: 'purple',
        running: 'blue',
        completed: 'green',
        failed: 'red'
    };

    return (
        <Box>
            <Flex justify="space-between" align="center" mb={6}>
                <Heading size="lg">WhatsApp Campaigns</Heading>
                <Button colorScheme="brand" leftIcon={<Send size={18} />} onClick={onOpen}>
                    <Box as="span" display={{ base: 'none', md: 'inline' }}>New Campaign</Box>
                </Button>
            </Flex>

            {/* List */}
            {loading ? (
                <Flex justify="center" py={10}><Spinner color="brand.500" size="xl" /></Flex>
            ) : campaigns.length === 0 ? (
                <Alert status="info" borderRadius="xl">
                    <AlertIcon />
                    No campaigns found. Create one to reach out to your customers!
                </Alert>
            ) : (
                <SimpleGrid columns={{ base: 1, lg: 2 }} gap={6}>
                    {campaigns.map(camp => (
                        <Card key={camp._id} borderRadius="2xl" shadow="sm" border="1px solid" borderColor="gray.100">
                            <CardBody>
                                <Flex justify="space-between" align="flex-start" mb={3}>
                                    <Box>
                                        <Heading size="md" mb={1}>{camp.name}</Heading>
                                        <Badge colorScheme={camp.type === 'promotional' ? 'pink' : 'cyan'}>
                                            {camp.type.toUpperCase()}
                                        </Badge>
                                    </Box>
                                    <Badge colorScheme={statusColors[camp.status]} fontSize="sm" px={3} py={1} borderRadius="full">
                                        {camp.status.toUpperCase()}
                                    </Badge>
                                </Flex>

                                <Box bg="gray.50" p={4} borderRadius="xl" mb={4}>
                                    <Text fontSize="sm" color="gray.600" mb={2} fontWeight="600">Message Template:</Text>
                                    <Text fontSize="sm" fontStyle="italic">"{camp.messageTemplate}"</Text>
                                </Box>

                                <HStack spacing={6} mb={4}>
                                    <VStack align="start" spacing={0}>
                                        <Text fontSize="xs" color="gray.500">Audience</Text>
                                        <HStack>
                                            <Users size={14} color="gray" />
                                            <Text fontSize="sm" fontWeight="bold">
                                                {camp.targetAudience.all ? 'All Customers' : camp.targetAudience.tiers.join(', ')}
                                            </Text>
                                        </HStack>
                                    </VStack>
                                    <VStack align="start" spacing={0}>
                                        <Text fontSize="xs" color="gray.500">Delivery Stats</Text>
                                        <HStack>
                                            <Smartphone size={14} color="gray" />
                                            <Text fontSize="sm" fontWeight="bold" color="green.600">{camp.stats.sentCount}</Text>
                                            <Text fontSize="sm" color="gray.400">/</Text>
                                            <Text fontSize="sm" fontWeight="bold">{camp.stats.totalTargeted}</Text>
                                            {camp.stats.failedCount > 0 && (
                                                <Text fontSize="xs" color="red.500" ml={2}>({camp.stats.failedCount} failed)</Text>
                                            )}
                                        </HStack>
                                    </VStack>
                                </HStack>

                                <Flex justify="space-between" align="center" mt={4} pt={4} borderTop="1px solid" borderColor="gray.100">
                                    <Text fontSize="xs" color="gray.400" display="flex" alignItems="center" gap={1}>
                                        <Clock size={12} /> {format(new Date(camp.createdAt), 'PPP p')}
                                    </Text>
                                    {camp.status === 'running' && (
                                        <Button size="sm" variant="outline" colorScheme="red" leftIcon={<XCircle size={16} />} onClick={() => handleCancel(camp._id)}>
                                            Cancel
                                        </Button>
                                    )}
                                </Flex>
                            </CardBody>
                        </Card>
                    ))}
                </SimpleGrid>
            )}

            {/* Create Modal */}
            <Modal isOpen={isOpen} onClose={onClose} size="xl">
                <ModalOverlay backdropFilter="blur(5px)" />
                <ModalContent borderRadius="2xl">
                    <ModalHeader>Create New Campaign</ModalHeader>
                    <ModalBody>
                        <VStack spacing={4} align="stretch">
                            <FormControl isRequired>
                                <FormLabel>Campaign Name</FormLabel>
                                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Diwali Mega Sale" />
                            </FormControl>

                            <FormControl>
                                <FormLabel>Campaign Type</FormLabel>
                                <Select value={type} onChange={e => setType(e.target.value)}>
                                    <option value="promotional">Promotional (Offers, Discounts)</option>
                                    <option value="broadcast">Broadcast (Announcements, Alerts)</option>
                                </Select>
                            </FormControl>

                            <Box p={4} border="1px solid" borderColor="brand.100" bg="brand.50" borderRadius="xl">
                                <FormControl mb={3}>
                                    <FormLabel fontWeight="bold" color="brand.800">Target Audience</FormLabel>
                                    <Checkbox isChecked={targetAll} onChange={(e) => setTargetAll(e.target.checked)} colorScheme="brand" fontWeight="bold">
                                        Target All Customers
                                    </Checkbox>
                                </FormControl>

                                {!targetAll && (
                                    <FormControl mt={3}>
                                        <FormLabel fontSize="sm" color="gray.600">Select Customer Tiers</FormLabel>
                                        <CheckboxGroup colorScheme="brand" value={selectedTiers} onChange={setSelectedTiers}>
                                            <HStack spacing={4}>
                                                <Checkbox value="Gold">Gold</Checkbox>
                                                <Checkbox value="Silver">Silver</Checkbox>
                                                <Checkbox value="Bronze">Bronze</Checkbox>
                                                <Checkbox value="Regular">Regular</Checkbox>
                                            </HStack>
                                        </CheckboxGroup>
                                    </FormControl>
                                )}
                            </Box>

                            <FormControl isRequired>
                                <FormLabel>Message Template</FormLabel>
                                <Textarea
                                    value={messageTemplate}
                                    onChange={e => setMessageTemplate(e.target.value)}
                                    rows={4}
                                    placeholder="Hello {name}, enjoy our latest offer..."
                                />
                                <Text fontSize="xs" color="gray.500" mt={2}>
                                    Available variables: <Badge>{`{name}`}</Badge> <Badge>{`{tier}`}</Badge>
                                </Text>
                            </FormControl>

                            <Alert status="warning" borderRadius="md" size="sm">
                                <AlertIcon />
                                <Box fontSize="sm">
                                    <Text fontWeight="bold">WhatsApp Rate Limits</Text>
                                    To prevent blocking, messages are sent with a 2-second delay between each customer. Large campaigns may take several minutes to complete.
                                </Box>
                            </Alert>

                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onClose} isDisabled={isSubmitting}>Cancel</Button>
                        <Button colorScheme="brand" onClick={handleCreate} isLoading={isSubmitting} leftIcon={<Send size={16} />}>
                            Launch Campaign
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

        </Box>
    );
}
