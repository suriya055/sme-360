import React, { useState, useEffect } from 'react';
import {
  Box, Heading, Card, CardBody, SimpleGrid,
  Button, Flex, Text, Table, Thead, Tbody, Tr, Th, Td,
  Spinner, Center, useColorModeValue, Badge
} from '@chakra-ui/react';
import { Upload, TrendingUp, Package, Tag, AlertCircle } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { saleAPI } from '../services/api';
import toast from 'react-hot-toast';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    dailyRevenue: [],
    categoryBreakdown: [],
    topProducts: []
  });

  const bgCard = useColorModeValue('white', 'gray.800');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await saleAPI.getAnalytics();
      setData(res.data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    // Generate simple CSV
    let csv = "Date,Revenue,Profit\n";
    data.dailyRevenue.forEach(row => {
      csv += `${row._id},${row.revenue},${row.profit || 0}\n`;
    });

    csv += "\nCategory,Revenue,Items Sold\n";
    data.categoryBreakdown.forEach(row => {
      csv += `${row._id},${row.revenue},${row.itemsSold}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SME360_Analytics_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Analytics exported successfully');
  };

  if (loading) {
    return (
      <Center h="70vh">
        <Spinner size="xl" color="brand.500" thickness="4px" />
      </Center>
    );
  }

  // Calculate totals
  const total7DayRevenue = data.dailyRevenue.reduce((acc, curr) => acc + curr.revenue, 0);
  const total7DayProfit = data.dailyRevenue.reduce((acc, curr) => acc + (curr.profit || 0), 0);

  return (
    <Box maxW="7xl" mx="auto" p={{ base: 2, md: 4 }}>
      <Flex justify="space-between" align="center" mb={6} flexWrap="wrap" gap={4}>
        <Box>
          <Heading size="lg" color="gray.800">Analytics Dashboard</Heading>
          <Text color="gray.500" mt={1}>Track business performance and sales trends</Text>
        </Box>
        <Button
          leftIcon={<Upload size={18} />}
          colorScheme="brand"
          onClick={handleExport}
          shadow="md"
        >
          Export Report
        </Button>
      </Flex>

      {/* Top Stats Cards */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={8}>
        <Card bg={bgCard} shadow="sm" borderRadius="xl">
          <CardBody>
            <Flex align="center" gap={4}>
              <Box p={3} bg="brand.50" borderRadius="lg" color="brand.600">
                <TrendingUp size={24} />
              </Box>
              <Box>
                <Text color="gray.500" fontSize="sm" fontWeight="600">7-Day Revenue</Text>
                <Heading size="md">₹{total7DayRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Heading>
              </Box>
            </Flex>
          </CardBody>
        </Card>
        <Card bg={bgCard} shadow="sm" borderRadius="xl">
          <CardBody>
            <Flex align="center" gap={4}>
              <Box p={3} bg="green.50" borderRadius="lg" color="green.600">
                <TrendingUp size={24} />
              </Box>
              <Box>
                <Text color="gray.500" fontSize="sm" fontWeight="600">7-Day Profit</Text>
                <Heading size="md">₹{total7DayProfit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Heading>
              </Box>
            </Flex>
          </CardBody>
        </Card>
        <Card bg={bgCard} shadow="sm" borderRadius="xl">
          <CardBody>
            <Flex align="center" gap={4}>
              <Box p={3} bg="purple.50" borderRadius="lg" color="purple.600">
                <Package size={24} />
              </Box>
              <Box>
                <Text color="gray.500" fontSize="sm" fontWeight="600">Top Categories</Text>
                <Heading size="md">{data.categoryBreakdown.length}</Heading>
              </Box>
            </Flex>
          </CardBody>
        </Card>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mb={8}>
        {/* Revenue Line Chart */}
        <Card bg={bgCard} shadow="sm" borderRadius="xl">
          <CardBody>
            <Heading size="md" mb={6} color="gray.700">7-Day Revenue & Profit Trend</Heading>
            {data.dailyRevenue.length > 0 ? (
              <Box h="300px">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.dailyRevenue} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{ fill: '#718096', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#718096', fontSize: 12 }} tickFormatter={(val) => `₹${val}`} />
                    <Tooltip
                      formatter={(value) => [`₹${value}`, ""]}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                    />
                    <Legend iconType="circle" />
                    <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="profit" name="Profit" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <Center h="300px" color="gray.500" flexDirection="column">
                <AlertCircle size={32} opacity={0.5} style={{ marginBottom: '8px' }} />
                <Text>No sales data for the last 7 days</Text>
              </Center>
            )}
          </CardBody>
        </Card>

        {/* Category Pie Chart */}
        <Card bg={bgCard} shadow="sm" borderRadius="xl">
          <CardBody>
            <Heading size="md" mb={6} color="gray.700">Revenue by Category (All Time)</Heading>
            {data.categoryBreakdown.length > 0 ? (
              <Box h="300px">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="revenue"
                      nameKey="_id"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {data.categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <Center h="300px" color="gray.500">No category data available</Center>
            )}
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Top Products Table */}
      <Card bg={bgCard} shadow="sm" borderRadius="xl">
        <CardBody>
          <Flex align="center" gap={2} mb={4}>
            <Tag color="#f59e0b" />
            <Heading size="md" color="gray.700">Top Performing Products</Heading>
          </Flex>
          <Box overflowX="auto">
            <Table variant="simple">
              <Thead bg="gray.50">
                <Tr>
                  <Th color="gray.500">Product Name</Th>
                  <Th isNumeric color="gray.500">Units Sold</Th>
                  <Th isNumeric color="gray.500">Total Revenue</Th>
                </Tr>
              </Thead>
              <Tbody>
                {data.topProducts.map((p, idx) => (
                  <Tr key={idx} _hover={{ bg: 'gray.50' }}>
                    <Td fontWeight="600" color="gray.800">
                      <Flex align="center" gap={3}>
                        <Badge colorScheme={idx < 3 ? 'orange' : 'gray'} borderRadius="full" w="24px" h="24px" display="flex" alignItems="center" justifyContent="center">
                          #{idx + 1}
                        </Badge>
                        {p._id || 'Unknown Product'}
                      </Flex>
                    </Td>
                    <Td isNumeric fontWeight="500">{p.sold}</Td>
                    <Td isNumeric fontWeight="bold" color="brand.600">₹{p.revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Td>
                  </Tr>
                ))}
                {data.topProducts.length === 0 && (
                  <Tr>
                    <Td colSpan={3} textAlign="center" py={6} color="gray.500">
                      No product sales recorded yet.
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </Box>
        </CardBody>
      </Card>
    </Box>
  );
}
