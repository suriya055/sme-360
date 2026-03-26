import React, { useState, useEffect } from 'react';
import {
    Box, Flex, Text, VStack, HStack, Badge, Button, Select,
    Heading, Card, CardBody, Avatar, useColorModeValue, Spinner,
    SimpleGrid, Alert, AlertIcon, AlertDescription
} from '@chakra-ui/react';
import { Star, MessageSquare, CheckCircle, Clock } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function Feedback() {
    const [feedback, setFeedback] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterRating, setFilterRating] = useState('all');
    const [page, setPage] = useState(1);

    const fetchFeedback = async () => {
        setLoading(true);
        try {
            const [resList, resStats] = await Promise.all([
                api.get('/feedback', { params: { status: filterStatus, rating: filterRating, page } }),
                api.get('/feedback/stats')
            ]);
            setFeedback(resList.data.data);
            setStats(resStats.data.stats);
        } catch (err) {
            toast.error('Failed to load feedback');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeedback();
    }, [filterStatus, filterRating, page]);

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            await api.patch(`/feedback/${id}/status`, { status: newStatus });
            toast.success('Status updated');
            fetchFeedback();
        } catch (err) {
            toast.error('Failed to update status');
        }
    };

    const statusColors = { new: 'blue', reviewed: 'orange', resolved: 'green' };

    return (
        <Box>
            <Heading size="lg" mb={6}>Customer Feedback & Ratings</Heading>

            {/* Stats Cards */}
            {stats && (
                <SimpleGrid columns={{ base: 1, md: 3 }} gap={6} mb={8}>
                    <Card borderRadius="2xl" shadow="sm" border="1px solid" borderColor="gray.100">
                        <CardBody>
                            <Text fontSize="sm" color="gray.500" fontWeight="600">Average Rating</Text>
                            <HStack mt={2}>
                                <Text fontSize="3xl" fontWeight="900">{(stats.averageRating || 0).toFixed(1)}</Text>
                                <Star color="#eab308" fill="#eab308" size={24} />
                            </HStack>
                            <Text fontSize="xs" color="gray.400" mt={1}>Out of {stats.totalReviews || 0} reviews</Text>
                        </CardBody>
                    </Card>
                </SimpleGrid>
            )}

            {/* Filters */}
            <Flex gap={4} mb={6} flexWrap="wrap">
                <Select w="200px" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }} bg="white" borderRadius="xl">
                    <option value="all">All Statuses</option>
                    <option value="new">New</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="resolved">Resolved</option>
                </Select>
                <Select w="200px" value={filterRating} onChange={e => { setFilterRating(e.target.value); setPage(1); }} bg="white" borderRadius="xl">
                    <option value="all">All Ratings</option>
                    <option value="5">5 Stars</option>
                    <option value="4">4 Stars</option>
                    <option value="3">3 Stars</option>
                    <option value="2">2 Stars</option>
                    <option value="1">1 Star</option>
                </Select>
            </Flex>

            {/* List */}
            {loading ? (
                <Flex justify="center" py={10}><Spinner color="brand.500" size="xl" /></Flex>
            ) : feedback.length === 0 ? (
                <Alert status="info" borderRadius="xl">
                    <AlertIcon />
                    <AlertDescription>No feedback found matching the filters.</AlertDescription>
                </Alert>
            ) : (
                <VStack spacing={4} align="stretch">
                    {feedback.map(item => (
                        <Card key={item._id} borderRadius="2xl" shadow="sm" border="1px solid" borderColor="gray.100" overflow="hidden">
                            <CardBody p={0}>
                                <Flex direction={{ base: 'column', md: 'row' }}>
                                    {/* Left Column: Customer & Rating */}
                                    <Box p={6} borderRight={{ md: '1px solid' }} borderColor={{ md: 'gray.100' }} w={{ md: '300px' }} bg="gray.50">
                                        <Flex align="center" gap={3} mb={3}>
                                            <Avatar size="sm" name={item.customerId?.name} bg="brand.200" color="brand.800" />
                                            <Box>
                                                <Text fontWeight="bold" fontSize="sm">{item.customerId?.name || 'Unknown'}</Text>
                                                <Text fontSize="xs" color="gray.500">{item.customerId?.phone}</Text>
                                            </Box>
                                        </Flex>
                                        <HStack spacing={1} mb={2}>
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} size={16} color={i < item.rating ? '#eab308' : '#e5e7eb'} fill={i < item.rating ? '#eab308' : 'none'} />
                                            ))}
                                        </HStack>
                                        <Text fontSize="xs" color="gray.400" display="flex" alignItems="center" gap={1}>
                                            <Clock size={12} /> {format(new Date(item.createdAt), 'PPP p')}
                                        </Text>
                                        <Badge mt={3} colorScheme="gray" borderRadius="full" px={2} fontSize="2xs">Source: {item.source}</Badge>
                                    </Box>

                                    {/* Right Column: Content & Actions */}
                                    <Flex p={6} flex="1" direction="column" justify="space-between">
                                        <Box>
                                            <Badge colorScheme={statusColors[item.status]} mb={3}>{item.status.toUpperCase()}</Badge>
                                            <Text color={item.comment ? "gray.800" : "gray.400"} fontStyle={item.comment ? "normal" : "italic"} fontSize="md" mb={4}>
                                                <MessageSquare size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} />
                                                {item.comment || 'No comment provided.'}
                                            </Text>
                                            {item.saleId && (
                                                <Text fontSize="xs" color="brand.600" fontWeight="600">
                                                    Related Sale: ₹{item.saleId.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })} on {format(new Date(item.saleId.date), 'PP')}
                                                </Text>
                                            )}
                                        </Box>

                                        <HStack mt={4} justify="flex-end">
                                            {item.status !== 'reviewed' && item.status !== 'resolved' && (
                                                <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(item._id, 'reviewed')}>
                                                    Mark Reviewed
                                                </Button>
                                            )}
                                            {item.status !== 'resolved' && (
                                                <Button size="sm" colorScheme="green" leftIcon={<CheckCircle size={16} />} onClick={() => handleStatusUpdate(item._id, 'resolved')}>
                                                    Resolve
                                                </Button>
                                            )}
                                        </HStack>
                                    </Flex>
                                </Flex>
                            </CardBody>
                        </Card>
                    ))}
                </VStack>
            )}
        </Box>
    );
}
