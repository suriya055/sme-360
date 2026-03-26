import React, { useState, useEffect } from 'react';
import {
    Box, Flex, Text, Heading, Button, Badge, useDisclosure, Modal, ModalOverlay,
    ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, FormControl,
    FormLabel, Input, Textarea, Select, VStack, HStack, useColorModeValue, IconButton,
    Tooltip, SimpleGrid, Image, Switch
} from '@chakra-ui/react';
import { Plus, Edit2, Trash2, Calendar, MapPin, Image as ImageIcon, Send } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { format, isBefore, isAfter, startOfDay } from 'date-fns';

export default function MallEvents() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [editingEvent, setEditingEvent] = useState(null);
    const [formData, setFormData] = useState({
        title: '', description: '', startDate: '', endDate: '', isMallWide: true, participatingShops: '', status: 'draft'
    });
    const [bannerFile, setBannerFile] = useState(null);

    const bg = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/events');
            setEvents(data);
        } catch (err) {
            toast.error('Failed to load events');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (event = null) => {
        if (event) {
            setEditingEvent(event);
            setFormData({
                title: event.title,
                description: event.description || '',
                startDate: format(new Date(event.startDate), 'yyyy-MM-dd'),
                endDate: format(new Date(event.endDate), 'yyyy-MM-dd'),
                isMallWide: event.isMallWide,
                participatingShops: event.participatingShops?.join(', ') || '',
                status: event.status
            });
        } else {
            setEditingEvent(null);
            setFormData({
                title: '', description: '', startDate: '', endDate: '', isMallWide: true, participatingShops: '', status: 'draft'
            });
        }
        setBannerFile(null);
        onOpen();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const submitData = new FormData();
        Object.keys(formData).forEach(key => {
            if (key === 'participatingShops') {
                const shopsArray = formData.participatingShops.split(',').map(s => s.trim()).filter(Boolean);
                submitData.append('participatingShops', JSON.stringify(shopsArray));
            } else {
                submitData.append(key, formData[key]);
            }
        });

        if (bannerFile) submitData.append('banner', bannerFile);

        try {
            if (editingEvent) {
                await api.put(`/events/${editingEvent._id}`, submitData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Event updated!');
            } else {
                await api.post('/events', submitData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Event created!');
            }
            onClose();
            fetchEvents();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save event');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this event?')) return;
        try {
            await api.delete(`/events/${id}`);
            toast.success('Event deleted');
            fetchEvents();
        } catch (error) {
            toast.error('Failed to delete event');
        }
    };

    const determineStatusUI = (event) => {
        const today = startOfDay(new Date());
        const start = startOfDay(new Date(event.startDate));
        const end = startOfDay(new Date(event.endDate));

        if (event.status === 'draft') return { label: 'Draft', color: 'gray' };
        if (isBefore(today, start)) return { label: 'Upcoming', color: 'blue' };
        if (isAfter(today, end)) return { label: 'Expired', color: 'red' };
        return { label: 'Active', color: 'green' }; // Published and within dates
    };

    return (
        <Box p={6}>
            <Flex justify="space-between" align="center" mb={6}>
                <Box>
                    <Heading size="lg" mb={1} color="gray.800">Events & Offers</Heading>
                    <Text color="gray.500">Manage mall-wide campaigns, festivals, and tenant sales.</Text>
                </Box>
                <Button colorScheme="brand" leftIcon={<Plus size="18" />} onClick={() => handleOpenModal()}>
                    <Box as="span" display={{ base: 'none', md: 'inline' }}>Create Event</Box>
                </Button>
            </Flex>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                {events.map(event => {
                    const statusUI = determineStatusUI(event);
                    return (
                        <Box key={event._id} bg={bg} borderRadius="xl" borderWidth="1px" borderColor={borderColor} overflow="hidden" _hover={{ shadow: 'md' }} transition="all 0.2s">
                            {/* Banner Placeholder */}
                            <Box h="150px" bg="gray.100" position="relative">
                                {event.bannerUrl ? (
                                    <Image src={event.bannerUrl.startsWith('http') ? event.bannerUrl : `/${event.bannerUrl}`} alt={event.title} objectFit="cover" w="full" h="full" />
                                ) : (
                                    <Flex h="full" align="center" justify="center" direction="column" color="gray.400">
                                        <ImageIcon size={32} />
                                        <Text fontSize="sm" mt={2}>No Banner</Text>
                                    </Flex>
                                )}
                                <Badge position="absolute" top={3} right={3} colorScheme={statusUI.color} fontSize="0.8em" px={2} py={1} borderRadius="md">
                                    {statusUI.label}
                                </Badge>
                            </Box>

                            <Box p={5}>
                                <Heading size="md" mb={2} noOfLines={1} title={event.title}>{event.title}</Heading>
                                <Text fontSize="sm" color="gray.500" noOfLines={2} mb={4} minH="40px">{event.description || 'No description provided.'}</Text>

                                <Flex align="center" fontSize="sm" color="gray.600" mb={2}>
                                    <Calendar size={14} style={{ marginRight: '8px' }} />
                                    {format(new Date(event.startDate), 'MMM dd')} - {format(new Date(event.endDate), 'MMM dd, yyyy')}
                                </Flex>

                                <Flex align="center" fontSize="sm" color="brand.600" mb={4} fontWeight="medium">
                                    <MapPin size={14} style={{ marginRight: '8px' }} />
                                    {event.isMallWide ? "Mall-Wide Event" : "Specific Tenants"}
                                </Flex>

                                <Flex justify="flex-end" gap={2} mt={4} borderTopWidth="1px" pt={4} borderColor={borderColor}>
                                    <Tooltip label="Edit Event">
                                        <IconButton size="sm" icon={<Edit2 size={16} />} variant="ghost" onClick={() => handleOpenModal(event)} />
                                    </Tooltip>
                                    <Tooltip label="Delete Event">
                                        <IconButton size="sm" icon={<Trash2 size={16} />} colorScheme="red" variant="ghost" onClick={() => handleDelete(event._id)} />
                                    </Tooltip>
                                </Flex>
                            </Box>
                        </Box>
                    );
                })}
                {events.length === 0 && !loading && (
                    <Box colSpan={3} textAlign="center" py={12} color="gray.500">No events found. Create one to get started!</Box>
                )}
            </SimpleGrid>

            {/* Create / Edit Modal */}
            <Modal isOpen={isOpen} onClose={onClose} size="lg">
                <ModalOverlay />
                <ModalContent as="form" onSubmit={handleSubmit}>
                    <ModalHeader>{editingEvent ? 'Edit Event' : 'Create New Event'}</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4}>
                            <FormControl isRequired>
                                <FormLabel>Event Title</FormLabel>
                                <Input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Diwali Weekend Deal" />
                            </FormControl>

                            <HStack w="full">
                                <FormControl isRequired>
                                    <FormLabel>Start Date</FormLabel>
                                    <Input type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
                                </FormControl>
                                <FormControl isRequired>
                                    <FormLabel>End Date</FormLabel>
                                    <Input type="date" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
                                </FormControl>
                            </HStack>

                            <FormControl>
                                <FormLabel>Banner Image (Optional)</FormLabel>
                                <Input type="file" accept="image/*" onChange={(e) => setBannerFile(e.target.files[0])} p={1} />
                            </FormControl>

                            <FormControl>
                                <FormLabel>Description</FormLabel>
                                <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} />
                            </FormControl>

                            <FormControl display="flex" alignItems="center" bg="gray.50" p={4} borderRadius="md" borderWidth="1px">
                                <FormLabel mb="0" flex="1">
                                    Is this a Mall-Wide Event?
                                </FormLabel>
                                <Switch colorScheme="brand" isChecked={formData.isMallWide} onChange={e => setFormData({ ...formData, isMallWide: e.target.checked })} />
                            </FormControl>

                            {!formData.isMallWide && (
                                <FormControl>
                                    <FormLabel>Participating Shops (Comma Separated)</FormLabel>
                                    <Input value={formData.participatingShops} onChange={e => setFormData({ ...formData, participatingShops: e.target.value })} placeholder="Zara, H&M, Lifestyle" />
                                </FormControl>
                            )}

                            <FormControl>
                                <FormLabel>Publish Status</FormLabel>
                                <Select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                    <option value="draft">Draft (Hidden)</option>
                                    <option value="published">Published (Visible on site)</option>
                                </Select>
                            </FormControl>
                        </VStack>
                    </ModalBody>

                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
                        <Button colorScheme="brand" type="submit">Save Event</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

        </Box>
    );
}
