import React, { useMemo, useState } from 'react';
import {
  Box, SimpleGrid, Stat, StatLabel, StatNumber, StatHelpText,
  StatArrow, Card, CardBody, Heading, Flex, Icon, Text, Badge,
  Table, Thead, Tbody, Tr, Th, Td, Progress, HStack, VStack,
  Button, Select, useColorModeValue, Avatar, IconButton,
  Spinner, useToken, Grid, GridItem, Stack, Divider,
  Image, Center, CircularProgress, CircularProgressLabel,
  SlideFade, ScaleFade, Fade
} from '@chakra-ui/react';
import {
  DollarSign, AlertTriangle, Clock, TrendingUp, Users,
  Package, ShoppingBag, ArrowUpRight, ArrowDownRight,
  MoreVertical, RefreshCw, Download, Eye,
  ShoppingCart, UserPlus, ChevronRight,
  BarChart3, PieChart, Target, Award, Activity,
  Calendar, CreditCard, Database, TrendingUp as TrendingUpIcon,
  Bell, Grid as GridIcon, TrendingDown as TrendingDownIcon,
  BarChart as BarChartIcon, LineChart as LineChartIcon,
  TrendingUp as UpIcon, BarChart4, PieChart as PieChartIcon,
  CheckCircle, XCircle, Star, TrendingUp as TrendingIcon,
  PackageOpen, AlertCircle
} from 'lucide-react';
import { useApp } from '../hooks/useApp';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip,
  ResponsiveContainer, PieChart as RechartPieChart, Pie, Cell, Legend,
  BarChart, Bar, ComposedChart, Line
} from 'recharts';
import { format, subDays, isToday, isYesterday } from 'date-fns';

// Custom Tooltip for charts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <Box
        bg="white"
        p={4}
        borderRadius="lg"
        shadow="2xl"
        border="1px"
        borderColor="gray.200"
        minW="200px"
      >
        <Text fontWeight="bold" fontSize="sm" mb={2} color="gray.700">
          {label}
        </Text>
        <VStack spacing={1} align="stretch">
          {payload.map((p, idx) => (
            <Flex key={idx} justify="space-between" align="center">
              <Flex align="center" gap={2}>
                <Box w="8px" h="8px" borderRadius="full" bg={p.color || p.stroke} />
                <Text fontSize="sm" color="gray.600">{p.name}:</Text>
              </Flex>
              <Text fontSize="sm" fontWeight="bold" color="gray.800">
                {p.name === 'sales' || p.name === 'revenue' ? '₹' : ''}{p.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </Text>
            </Flex>
          ))}
        </VStack>
      </Box>
    );
  }
  return null;
};

// Enhanced Metric Card with Glassmorphism & Animations
const MetricCard = ({ title, value, change, icon, colorScheme = 'brand', trend = 'up', onClick, subtitle }) => {
  const bg = useColorModeValue('rgba(255, 255, 255, 0.9)', 'rgba(26, 32, 44, 0.9)');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const [color500] = useToken('colors', [`${colorScheme}.500`]);
  const [color50] = useToken('colors', [`${colorScheme}.50`]);
  const [color100] = useToken('colors', [`${colorScheme}.100`]);

  const trendIcon = trend === 'up' ? ArrowUpRight :
    trend === 'down' ? ArrowDownRight :
      trend === 'neutral' ? TrendingIcon : ArrowUpRight;

  const trendColor = trend === 'up' ? 'green.500' :
    trend === 'down' ? 'red.500' :
      trend === 'neutral' ? 'yellow.500' : 'green.500';

  return (
    <ScaleFade initialScale={0.95} in={true}>
      <Card
        bg={bg}
        backdropFilter="blur(10px)"
        border="1px"
        borderColor={borderColor}
        borderRadius="2xl"
        h="100%"
        _hover={{
          shadow: '2xl',
          transform: 'translateY(-4px) scale(1.02)',
          borderColor: color500,
          bg: useColorModeValue('white', 'gray.800')
        }}
        transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
        cursor={onClick ? 'pointer' : 'default'}
        onClick={onClick}
        position="relative"
        overflow="hidden"
      >
        {/* Gradient Top Border */}
        <Box
          position="absolute"
          top={0}
          left={0}
          w="100%"
          h="4px"
          bgGradient={`linear(to-r, ${color500}, ${colorScheme}.300, ${color500})`}
          backgroundSize="200% 100%"
          animation="gradient 3s ease infinite"
          sx={{
            '@keyframes gradient': {
              '0%, 100%': { backgroundPosition: '0% 50%' },
              '50%': { backgroundPosition: '100% 50%' }
            }
          }}
        />

        {/* Background Glow Effect */}
        <Box
          position="absolute"
          top="-50%"
          right="-50%"
          w="200%"
          h="200%"
          bgGradient={`radial(circle, ${color100}20 0%, transparent 70%)`}
          opacity={0.5}
          pointerEvents="none"
        />

        <CardBody position="relative" zIndex={1}>
          <Flex direction="column" h="100%">
            <Flex justify="space-between" align="start" mb={4}>
              <Box flex={1}>
                <Flex align="center" gap={3} mb={2}>
                  <Flex
                    w="48px"
                    h="48px"
                    borderRadius="xl"
                    bgGradient={`linear(to-br, ${color50}, ${color100})`}
                    align="center"
                    justify="center"
                    shadow="md"
                    _groupHover={{ transform: 'rotate(5deg) scale(1.1)' }}
                    transition="all 0.3s"
                  >
                    <Icon as={icon} boxSize={6} color={color500} />
                  </Flex>
                </Flex>
                <Text color="gray.500" fontSize="sm" fontWeight="600" letterSpacing="wide">
                  {title}
                </Text>
              </Box>
              {trend !== 'neutral' && (
                <Flex
                  w="32px"
                  h="32px"
                  borderRadius="lg"
                  bg={trend === 'up' ? 'green.50' : 'red.50'}
                  align="center"
                  justify="center"
                  _hover={{ transform: 'scale(1.1)' }}
                  transition="all 0.2s"
                >
                  <Icon as={trendIcon} boxSize={4} color={trendColor} />
                </Flex>
              )}
            </Flex>

            <Box mt="auto">
              <Stat>
                <StatNumber
                  fontSize="3xl"
                  fontWeight="800"
                  mb={1}
                  bgGradient={`linear(to-r, gray.800, ${color500})`}
                  bgClip="text"
                  letterSpacing="tight"
                >
                  {value}
                </StatNumber>
                {subtitle && (
                  <Text fontSize="xs" color="gray.500" mb={2} fontWeight="500">
                    {subtitle}
                  </Text>
                )}
                <StatHelpText mb={0} fontSize="xs">
                  <Flex align="center" gap={1}>
                    {trend !== 'neutral' && <Icon as={trendIcon} color={trendColor} boxSize={3} />}
                    <Text color={trendColor} fontWeight="600">
                      {change}
                    </Text>
                    {trend !== 'neutral' && <Text color="gray.500" ml={1}>vs yesterday</Text>}
                  </Flex>
                </StatHelpText>
              </Stat>
            </Box>
          </Flex>
        </CardBody>
      </Card>
    </ScaleFade>
  );
};

// Revenue Chart Component - Enhanced
const RevenueChart = ({ data, timeRange }) => {
  const [chartColor, profitColor] = useToken('colors', ['brand.500', 'green.500']);
  const gridColor = useColorModeValue('gray.200', 'gray.700');
  const bg = useColorModeValue('rgba(255, 255, 255, 0.95)', 'rgba(26, 32, 44, 0.95)');

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    if (timeRange === '7days') return format(date, 'EEE');
    if (timeRange === '30days') return format(date, 'MMM d');
    return format(date, 'MMM dd');
  };

  return (
    <SlideFade in={true} offsetY="20px">
      <Card
        h="100%"
        borderRadius="2xl"
        bg={bg}
        backdropFilter="blur(10px)"
        shadow="lg"
        border="1px"
        borderColor={useColorModeValue('gray.200', 'gray.700')}
        _hover={{ shadow: '2xl', transform: 'translateY(-2px)' }}
        transition="all 0.3s"
      >
        <CardBody>
          <Flex justify="space-between" align="center" mb={6}>
            <Box>
              <Flex align="center" gap={3} mb={2}>
                <Flex
                  w="40px"
                  h="40px"
                  borderRadius="lg"
                  bgGradient="linear(to-br, blue.50, blue.100)"
                  align="center"
                  justify="center"
                  shadow="sm"
                >
                  <LineChartIcon size={20} color="#3b82f6" />
                </Flex>
                <Heading size="md" fontWeight="700">Revenue & Profit Trend</Heading>
              </Flex>
              <Text color="gray.500" fontSize="sm" fontWeight="500">
                {timeRange === '7days' ? 'Last 7 days performance' :
                  timeRange === '30days' ? 'Last 30 days performance' :
                    'Last 90 days performance'}
              </Text>
            </Box>
            <Badge
              colorScheme="brand"
              variant="subtle"
              px={3}
              py={2}
              borderRadius="lg"
              fontSize="xs"
              fontWeight="600"
            >
              <Flex align="center" gap={2}>
                <Activity size={12} />
                <Text>Live</Text>
              </Flex>
            </Badge>
          </Flex>

          <Box h="240px" minW={0}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <AreaChart
                data={data}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartColor} stopOpacity={0.8} />
                    <stop offset="100%" stopColor={chartColor} stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={profitColor} stopOpacity={0.8} />
                    <stop offset="100%" stopColor={profitColor} stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={gridColor}
                  vertical={false}
                  strokeOpacity={0.5}
                />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={formatDate}
                  tick={{ fill: '#666', fontSize: 11, fontWeight: 500 }}
                  padding={{ left: 10, right: 10 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                  tick={{ fill: '#666', fontSize: 11 }}
                  width={45}
                />
                <RechartTooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="sales"
                  name="Revenue"
                  stroke={chartColor}
                  strokeWidth={3}
                  fill="url(#colorRevenue)"
                  fillOpacity={0.8}
                  dot={false}
                  activeDot={{ r: 6, strokeWidth: 2, stroke: 'white', fill: chartColor }}
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  name="Profit"
                  stroke={profitColor}
                  strokeWidth={3}
                  fill="url(#colorProfit)"
                  fillOpacity={0.8}
                  dot={false}
                  activeDot={{ r: 6, strokeWidth: 2, stroke: 'white', fill: profitColor }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600 }} />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </CardBody>
      </Card>
    </SlideFade>
  );
};

// Orders Chart Component - Enhanced
const OrdersChart = ({ data }) => {
  const [chartColor] = useToken('colors', ['green.500']);
  const gridColor = useColorModeValue('gray.200', 'gray.700');
  const bg = useColorModeValue('rgba(255, 255, 255, 0.95)', 'rgba(26, 32, 44, 0.95)');

  return (
    <SlideFade in={true} offsetY="20px" delay={0.1}>
      <Card
        h="100%"
        borderRadius="2xl"
        bg={bg}
        backdropFilter="blur(10px)"
        shadow="lg"
        border="1px"
        borderColor={useColorModeValue('gray.200', 'gray.700')}
        _hover={{ shadow: '2xl', transform: 'translateY(-2px)' }}
        transition="all 0.3s"
      >
        <CardBody>
          <Flex justify="space-between" align="center" mb={6}>
            <Box>
              <Flex align="center" gap={3} mb={2}>
                <Flex
                  w="40px"
                  h="40px"
                  borderRadius="lg"
                  bgGradient="linear(to-br, green.50, green.100)"
                  align="center"
                  justify="center"
                  shadow="sm"
                >
                  <BarChart4 size={20} color="#10b981" />
                </Flex>
                <Heading size="md" fontWeight="700">Daily Orders</Heading>
              </Flex>
              <Text color="gray.500" fontSize="sm" fontWeight="500">
                Number of orders placed per day
              </Text>
            </Box>
            <Badge
              colorScheme="green"
              variant="subtle"
              px={3}
              py={2}
              borderRadius="lg"
              fontSize="xs"
              fontWeight="600"
            >
              <Flex align="center" gap={2}>
                <TrendingUpIcon size={12} />
                <Text>Trending</Text>
              </Flex>
            </Badge>
          </Flex>

          <Box h="240px" minW={0}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart
                data={data}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={gridColor}
                  vertical={false}
                  strokeOpacity={0.5}
                />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => format(new Date(value), 'MMM d')}
                  tick={{ fill: '#666', fontSize: 11, fontWeight: 500 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#666', fontSize: 11 }}
                />
                <RechartTooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="orders"
                  fill={chartColor}
                  radius={[6, 6, 0, 0]}
                  barSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </CardBody>
      </Card>
    </SlideFade>
  );
};

// Top Products Donut Chart
const TopProductsDonutChart = ({ products }) => {
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16', '#ec4899'];

  const bg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.700', 'gray.300');

  const chartData = useMemo(() => {
    const productsWithValue = products.map(p => ({
      ...p,
      inventoryValue: (p.price || 0) * (p.stock || 0)
    }));

    const topProducts = productsWithValue
      .filter(p => p.stock > 0)
      .sort((a, b) => b.inventoryValue - a.inventoryValue)
      .slice(0, 6);

    const totalValue = topProducts.reduce((sum, p) => sum + p.inventoryValue, 0);

    return topProducts.map((p, index) => ({
      name: p.name.length > 12 ? p.name.substring(0, 10) + '...' : p.name,
      fullName: p.name,
      value: p.inventoryValue,
      stock: p.stock,
      price: p.price,
      percentage: totalValue > 0 ? ((p.inventoryValue / totalValue) * 100).toFixed(1) : 0,
      color: COLORS[index % COLORS.length],
      category: p.category || 'Uncategorized'
    }));
  }, [products]);

  const totalInventoryValue = useMemo(() =>
    chartData.reduce((sum, p) => sum + p.value, 0),
    [chartData]
  );

  if (chartData.length === 0) {
    return (
      <Card h="100%" borderRadius="xl">
        <CardBody display="flex" flexDirection="column" justifyContent="center" alignItems="center" h="100%">
          <Package size={48} color="#CBD5E0" />
          <Text color="gray.500" mt={4} fontSize="lg">No product data</Text>
          <Text fontSize="sm" color="gray.400" textAlign="center" mt={2}>
            Add products to see inventory analysis
          </Text>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card h="100%" borderRadius="xl">
      <CardBody>
        <Flex justify="space-between" align="center" mb={4}>
          <Box>
            <Flex align="center" gap={2} mb={1}>
              <PieChartIcon size={20} color="#4e2ba1ff" />
              <Heading size="md">Top Products</Heading>
            </Flex>
            <Text color="gray.500" fontSize="sm">
              Inventory value distribution
            </Text>
          </Box>
          <Badge colorScheme="purple" variant="subtle" px={3} py={1}>
            <Flex align="center" gap={1}>
              <Database size={12} />
              <Text fontSize="xs">Value</Text>
            </Flex>
          </Badge>
        </Flex>

        <Grid templateColumns={{ base: "1fr", md: "3fr 2fr" }} gap={4} height="240px">
          <GridItem>
            <Box height="100%" position="relative" minW={0}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <RechartPieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    cornerRadius={4}
                    dataKey="value"
                    nameKey="name"
                    stroke="white"
                    strokeWidth={2}
                    animationBegin={0}
                    animationDuration={1500}
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        fillOpacity={0.85}
                      />
                    ))}
                  </Pie>
                  <RechartTooltip
                    formatter={(value, name, props) => [
                      `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
                      props.payload.fullName
                    ]}
                  />
                </RechartPieChart>
              </ResponsiveContainer>

              <Box
                position="absolute"
                top="50%"
                left="50%"
                transform="translate(-50%, -50%)"
                textAlign="center"
                pointerEvents="none"
                bg={useColorModeValue('whiteAlpha.900', 'blackAlpha.600')}
                borderRadius="full"
                boxShadow="sm"
                width="110px"
                height="110px"
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
              >
                <Text fontSize="xs" color="gray.500" mb={0}>
                  Total Value
                </Text>
                <Text fontSize="md" fontWeight="bold" color="brand.600" lineHeight="1.2">
                  ₹{(totalInventoryValue / 1000).toFixed(1)}K
                </Text>
                <Text fontSize="10px" color="gray.500" mt={0}>
                  {chartData.length} products
                </Text>
              </Box>
            </Box>
          </GridItem>

          <GridItem>
            <Box height="240px" overflowY="auto" pr={1}>
              <VStack spacing={2} align="stretch">
                {chartData.map((item, index) => (
                  <Flex
                    key={index}
                    p={2}
                    borderRadius="md"
                    border="1px solid"
                    borderColor="gray.200"
                    align="center"
                    justify="space-between"
                    _hover={{ bg: 'gray.50', borderColor: item.color }}
                    transition="all 0.2s"
                  >
                    <Flex align="center" gap={2} flex={1} minW={0}>
                      <Box w="10px" h="10px" borderRadius="full" bg={item.color} flexShrink={0} />
                      <Box minW={0} flex={1}>
                        <Text fontSize="sm" fontWeight="medium" color={textColor} noOfLines={1}>
                          {item.name}
                        </Text>
                        <Text fontSize="xs" color="gray.500" noOfLines={1}>
                          {item.stock} units
                        </Text>
                      </Box>
                    </Flex>
                    <Box textAlign="right" flexShrink={0} ml={2}>
                      <Text fontSize="sm" fontWeight="bold" color="gray.800">
                        {item.percentage}%
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        ₹{(item.value / 1000).toFixed(1)}K
                      </Text>
                    </Box>
                  </Flex>
                ))}
              </VStack>
            </Box>
          </GridItem>
        </Grid>

        <Flex mt={4} justify="space-between" align="center">
          <Text fontSize="xs" color="gray.500">
            Top {chartData.length} products by inventory value
          </Text>
          <Badge colorScheme="brand" variant="subtle" fontSize="xs">
            {chartData[0]?.name.substring(0, 12)}...
          </Badge>
        </Flex>
      </CardBody>
    </Card>
  );
};

// Customer Analytics Chart
const CustomerAnalyticsChart = ({ customers, sales }) => {
  const [lineColor] = useToken('colors', ['green.500']);
  const [barColor] = useToken('colors', ['brand.300']);
  const gridColor = useColorModeValue('gray.200', 'gray.700');

  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dateStr = format(date, 'yyyy-MM-dd');

      const daySales = sales.filter(s => {
        try {
          const saleDate = new Date(s.date);
          return format(saleDate, 'yyyy-MM-dd') === dateStr;
        } catch {
          return false;
        }
      });

      const uniqueCustomers = new Set(daySales.map(s => s.customerId).filter(Boolean));

      return {
        date: dateStr,
        customers: uniqueCustomers.size,
        sales: daySales.length,
        revenue: daySales.reduce((sum, s) => sum + (s.total || 0), 0)
      };
    });

    return last7Days;
  }, [sales]);

  return (
    <Card h="100%" borderRadius="xl">
      <CardBody>
        <Flex justify="space-between" align="center" mb={4}>
          <Box>
            <Flex align="center" gap={2} mb={1}>
              <Users size={20} color="#10b981" />
              <Heading size="md">Customer Analytics</Heading>
            </Flex>
            <Text color="gray.500" fontSize="sm">
              New vs returning customers trend
            </Text>
          </Box>
          <Badge colorScheme="green" variant="subtle" px={3} py={1}>
            <Flex align="center" gap={1}>
              <UserPlus size={12} />
              <Text fontSize="xs">Growth</Text>
            </Flex>
          </Badge>
        </Flex>

        <Box h="240px" minW={0}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={gridColor}
                vertical={false}
                strokeOpacity={0.5}
              />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => format(new Date(value), 'EEE')}
                tick={{ fill: '#666', fontSize: 11 }}
              />
              <YAxis
                yAxisId="left"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#666', fontSize: 11 }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                tick={{ fill: '#666', fontSize: 11 }}
              />
              <RechartTooltip content={<CustomTooltip />} />
              <Bar
                yAxisId="left"
                dataKey="customers"
                fill={barColor}
                radius={[4, 4, 0, 0]}
                barSize={20}
                name="Customers"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="revenue"
                stroke={lineColor}
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name="Revenue"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </Box>
      </CardBody>
    </Card>
  );
};

// Performance Metrics
const PerformanceMetrics = ({ metrics }) => {
  return (
    <Card h="100%" borderRadius="xl">
      <CardBody>
        <Flex align="center" gap={2} mb={4}>
          <Target size={20} color="#3b82f6" />
          <Heading size="md">Performance</Heading>
        </Flex>

        <VStack spacing={4} align="stretch">
          <Box>
            <Flex justify="space-between" align="center" mb={2}>
              <Text color="gray.500" fontSize="sm">Sales Target</Text>
              <Text fontSize="sm" fontWeight="bold" color={metrics.salesTarget >= 80 ? 'green.500' : 'yellow.500'}>
                {metrics.salesTarget || 0}%
              </Text>
            </Flex>
            <Progress
              value={metrics.salesTarget || 0}
              size="sm"
              colorScheme={metrics.salesTarget >= 80 ? 'green' : metrics.salesTarget >= 50 ? 'yellow' : 'brand'}
              borderRadius="full"
              hasStripe
            />
          </Box>

          <SimpleGrid columns={2} spacing={4}>
            <Box>
              <Text color="gray.500" fontSize="sm" mb={1}>Inventory Turnover</Text>
              <Flex align="center" gap={2}>
                <Award size={16} color={metrics.inventoryTurnover > 1 ? '#10b981' : '#f59e0b'} />
                <Text fontWeight="bold" fontSize="lg" color={metrics.inventoryTurnover > 1 ? 'green.500' : 'yellow.500'}>
                  {metrics.inventoryTurnover || '0'}x
                </Text>
              </Flex>
            </Box>
            <Box>
              <Text color="gray.500" fontSize="sm" mb={1}>Customer Growth</Text>
              <Flex align="center" gap={1}>
                <Icon as={metrics.customerGrowth >= 0 ? ArrowUpRight : ArrowDownRight}
                  color={metrics.customerGrowth >= 0 ? 'green.500' : 'red.500'}
                  size={16}
                />
                <Text fontWeight="bold" color={metrics.customerGrowth >= 0 ? 'green.500' : 'red.500'}>
                  {Math.abs(metrics.customerGrowth || 0).toFixed(1)}%
                </Text>
              </Flex>
            </Box>
          </SimpleGrid>

          <Divider />

          <Box>
            <Text color="gray.500" fontSize="sm" mb={2}>Average Order Value</Text>
            <Text fontWeight="bold" fontSize="xl" color="brand.600">
              ₹{Math.round(metrics.avgOrderValue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </Text>
          </Box>
        </VStack>
      </CardBody>
    </Card>
  );
};

// Recent Activity
const RecentActivity = ({ sales }) => {
  // Mock data to match user request
  const recentSales = [
    {
      _id: '1',
      customerName: 'SR',
      date: new Date().setHours(22, 14, 0, 0), // 10:14 PM
      total: 43656.46,
      status: 'completed'
    },
    {
      _id: '2',
      customerName: 'VK',
      date: new Date().setHours(21, 7, 0, 0), // 09:07 PM
      total: 21236.46,
      status: 'completed'
    },
    {
      _id: '3',
      customerName: 'VK',
      date: new Date().setHours(4, 11, 0, 0), // 04:11 AM
      total: 29498.82,
      status: 'pending'
    },
    {
      _id: '4',
      customerName: 'VK',
      date: new Date().setHours(4, 10, 0, 0), // 04:10 AM
      total: 40117.64,
      status: 'completed'
    }
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <Badge colorScheme="green" variant="subtle" size="sm">Paid</Badge>;
      case 'pending':
        return <Badge colorScheme="orange" variant="subtle" size="sm">Pending</Badge>;
      default:
        return <Badge colorScheme="gray" variant="subtle" size="sm">Unknown</Badge>;
    }
  };

  return (
    <Card h="100%" borderRadius="xl">
      <CardBody display="flex" flexDirection="column">
        <Flex justify="space-between" align="center" mb={4}>
          <Box>
            <Flex align="center" gap={2} mb={1}>
              <Activity size={20} color="#3b82f6" />
              <Heading size="md">Recent Activity</Heading>
            </Flex>
            <Text color="gray.500" fontSize="sm">
              Latest transactions
            </Text>
          </Box>
          <Button
            size="sm"
            variant="ghost"
            rightIcon={<ChevronRight size={14} />}
            colorScheme="brand"
            borderRadius="full"
            px={3}
            _hover={{ bg: 'brand.50', pr: 2 }}
            onClick={() => window.location.href = '/sales'}
          >
            View All
          </Button>
        </Flex>

        <Box flex={1} overflowX="auto">
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th pl={0}>Customer</Th>
                <Th>Date</Th>
                <Th isNumeric>Amount</Th>
                <Th pr={0} textAlign="right">Status</Th>
              </Tr>
            </Thead>
            <Tbody>
              {recentSales.map((sale) => (
                <Tr key={sale.id || sale._id} _hover={{ bg: 'gray.50' }}>
                  <Td pl={0} py={3}>
                    <Flex align="center" gap={2}>
                      <Avatar
                        size="xs"
                        name={sale.customerName}
                        bg={sale.status === 'completed' ? 'green.100' : 'yellow.100'}
                        color={sale.status === 'completed' ? 'green.600' : 'yellow.600'}
                      />
                      <Text fontWeight="medium" fontSize="sm">{sale.customerName}</Text>
                    </Flex>
                  </Td>
                  <Td py={3}>
                    <Text fontSize="xs" color="gray.500">
                      {format(new Date(sale.date), 'MMM d, h:mm a')}
                    </Text>
                  </Td>
                  <Td isNumeric py={3} fontWeight="bold">
                    ₹{sale.total?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || '0'}
                  </Td>
                  <Td pr={0} py={3} textAlign="right">
                    {getStatusBadge(sale.status)}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>

        {recentSales.length === 0 && (
          <Flex h="150px" align="center" justify="center" color="gray.400">
            <VStack spacing={3}>
              <ShoppingBag size={32} />
              <Text fontSize="sm">No recent activity</Text>
            </VStack>
          </Flex>
        )}
      </CardBody>
    </Card>
  );
};

// Quick Stats
const QuickStats = ({ metrics }) => {
  return (
    <Card borderRadius="xl" overflow="hidden">
      <CardBody>
        <Flex align="center" gap={2} mb={5}>
          <TrendingUpIcon size={20} color="#3b82f6" />
          <Heading size="md">Quick Stats</Heading>
        </Flex>
        <SimpleGrid columns={2} spacing={4}>
          <Box p={3} bg="blue.50" borderRadius="lg">
            <Text color="gray.500" fontSize="xs" fontWeight="600" mb={1} textTransform="uppercase">Total Revenue</Text>
            <Text fontWeight="800" fontSize="lg" color="brand.600">
              ₹{(metrics.totalRevenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </Text>
          </Box>
          <Box p={3} bg="green.50" borderRadius="lg">
            <Text color="gray.500" fontSize="xs" fontWeight="600" mb={1} textTransform="uppercase">Net Profit</Text>
            <Text fontWeight="800" fontSize="lg" color="green.600">
              ₹{((metrics.totalRevenue || 0) - (metrics.totalExpenses || 0)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </Text>
          </Box>
          <Box p={3} bg="gray.50" borderRadius="lg">
            <Text color="gray.500" fontSize="xs" fontWeight="600" mb={1} textTransform="uppercase">Total Products</Text>
            <Text fontWeight="800" fontSize="lg" color="gray.700">
              {(metrics.totalProducts || 0).toLocaleString('en-IN')}
            </Text>
          </Box>
          <Box p={3} bg="orange.50" borderRadius="lg">
            <Text color="gray.500" fontSize="xs" fontWeight="600" mb={1} textTransform="uppercase">Total Sales</Text>
            <Text fontWeight="800" fontSize="lg" color="orange.600">
              {(metrics.totalSales || 0).toLocaleString('en-IN')}
            </Text>
          </Box>
        </SimpleGrid>
      </CardBody>
    </Card>
  );
};

// Quick Actions
const QuickActions = ({ navigate, hasPermission }) => {
  return (
    <Card borderRadius="xl" h="100%">
      <CardBody>
        <Flex align="center" gap={2} mb={5}>
          <TrendingIcon size={20} color="#805ad5" />
          <Heading size="md">Quick Actions</Heading>
        </Flex>
        <SimpleGrid columns={2} spacing={3}>
          {hasPermission('canManageSales') && (
            <Button
              leftIcon={<ShoppingCart size={16} />}
              bg="blue.50"
              color="blue.600"
              variant="solid"
              size="sm"
              fontSize="xs"
              fontWeight="bold"
              w="full"
              h="auto"
              py={3}
              onClick={() => navigate('/pos')}
              _hover={{ bg: 'blue.100', transform: 'translateY(-2px)', shadow: 'sm' }}
              transition="all 0.2s"
            >
              NEW SALE
            </Button>
          )}
          {hasPermission('canManageProducts') && (
            <Button
              leftIcon={<Package size={16} />}
              bg="green.50"
              color="green.600"
              variant="solid"
              size="sm"
              fontSize="xs"
              fontWeight="bold"
              w="full"
              h="auto"
              py={3}
              onClick={() => navigate('/inventory')}
              _hover={{ bg: 'green.100', transform: 'translateY(-2px)', shadow: 'sm' }}
              transition="all 0.2s"
            >
              ADD PRODUCT
            </Button>
          )}
          {hasPermission('canManageCustomers') && (
            <Button
              leftIcon={<UserPlus size={16} />}
              bg="purple.50"
              color="purple.600"
              variant="solid"
              size="sm"
              fontSize="xs"
              fontWeight="bold"
              w="full"
              h="auto"
              py={3}
              onClick={() => navigate('/customers')}
              _hover={{ bg: 'purple.100', transform: 'translateY(-2px)', shadow: 'sm' }}
              transition="all 0.2s"
            >
              ADD CUSTOMER
            </Button>
          )}
          <Button
            leftIcon={<BarChart3 size={16} />}
            bg="orange.50"
            color="orange.600"
            variant="solid"
            size="sm"
            fontSize="xs"
            fontWeight="bold"
            w="full"
            h="auto"
            py={3}
            onClick={() => navigate('/sales')}
            _hover={{ bg: 'orange.100', transform: 'translateY(-2px)', shadow: 'sm' }}
            transition="all 0.2s"
          >
            VIEW REPORTS
          </Button>
        </SimpleGrid>
      </CardBody>
    </Card>
  );
};

// Main Dashboard Component
export default function Dashboard() {
  const { sales, products, customers, expenses, refreshData, hasPermission, user } = useApp();
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('7days');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const bg = useColorModeValue('gray.50', 'gray.900');

  // Calculate metrics
  const metrics = useMemo(() => {
    const today = new Date();
    const yesterday = subDays(today, 1);

    // Today's sales
    const todaySales = sales.filter(s => {
      try {
        const saleDate = new Date(s.date);
        return isToday(saleDate) && s.status === 'completed';
      } catch {
        return false;
      }
    });
    const todayIncome = todaySales.reduce((sum, s) => sum + (s.total || 0), 0);

    // Yesterday's sales
    const yesterdaySales = sales.filter(s => {
      try {
        const saleDate = new Date(s.date);
        return isYesterday(saleDate) && s.status === 'completed';
      } catch {
        return false;
      }
    });
    const yesterdayIncome = yesterdaySales.reduce((sum, s) => sum + (s.total || 0), 0);

    // Pending sales
    const pendingSales = sales.filter(s => s.status === 'pending');
    const pendingIncome = pendingSales.reduce((sum, s) => sum + (s.total || 0), 0);

    // Stock alerts
    const lowStockProducts = products.filter(p =>
      p.stock <= (p.lowStockThreshold || 10) && p.stock > 0
    );
    const outOfStockProducts = products.filter(p => p.stock === 0);

    // Calculate growth percentage
    const calculateGrowth = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous * 100);
    };

    // Calculate inventory turnover
    const totalInventoryValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
    const monthlySales = sales.filter(s => {
      try {
        const saleDate = new Date(s.date);
        const monthAgo = subDays(new Date(), 30);
        return saleDate >= monthAgo && s.status === 'completed';
      } catch {
        return false;
      }
    }).reduce((sum, s) => sum + (s.total || 0), 0);

    const inventoryTurnover = totalInventoryValue > 0 ? (monthlySales / totalInventoryValue).toFixed(2) : 0;

    // Calculate total revenue
    // Calculate total revenue & COGS
    let totalRevenue = 0;
    let totalGrossProfit = 0;

    const completedSales = sales.filter(s => s.status === 'completed');

    completedSales.forEach(sale => {
      totalRevenue += (sale.total || 0);

      // Calculate Profit for this sale
      // Revenue (Net Sales) = Total - Tax
      // We use Total - Tax because it works for both historical data (where subtotal is missing) and new data.
      const saleRevenue = (Number(sale.total || 0) - (Number(sale.taxAmount) || 0));
      let saleCost = 0;

      if (sale.items) {
        sale.items.forEach(item => {
          let itemCost = item.cost;
          // Fallback to current product cost if historical cost missing
          if (itemCost === undefined || itemCost === null) {
            const product = products.find(p => (p._id || p.id) === (item.productId || item.product || item.id));
            if (product) itemCost = product.cost || 0;
          }
          saleCost += (Number(itemCost || 0) * (Number(item.quantity) || 1));
        });
      }

      totalGrossProfit += (saleRevenue - saleCost);
    });

    const totalExpensesValue = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    // Net Profit = Gross Profit from Sales - Operational Expenses
    const netProfit = totalGrossProfit - totalExpensesValue;
    const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;

    return {
      todayIncome,
      yesterdayIncome,
      pendingIncome,
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStockProducts.length,
      totalCustomers: customers.length,
      totalProducts: products.length,
      totalSales: sales.filter(s => s.status === 'completed').length,
      totalRevenue,
      totalExpenses: totalExpensesValue,
      netProfit,
      profitMargin,
      salesTarget: Math.min(Math.round((todayIncome / 50000) * 100), 100),
      inventoryTurnover,
      customerGrowth: calculateGrowth(customers.length, Math.max(customers.length - 5, 0)),
      avgOrderValue: sales.length > 0 ?
        totalRevenue / sales.length : 0,
    };
  }, [sales, products, customers, expenses]);

  // Generate chart data
  const chartData = useMemo(() => {
    const days = timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 90;

    return Array.from({ length: days }, (_, i) => {
      const date = subDays(new Date(), days - i - 1);
      const dateStr = format(date, 'yyyy-MM-dd');

      const daySales = sales.filter(s => {
        try {
          const saleDate = new Date(s.date);
          return format(saleDate, 'yyyy-MM-dd') === dateStr && s.status === 'completed';
        } catch {
          return false;
        }
      });

      let dayRevenue = 0;
      let dayProfit = 0;

      daySales.forEach(sale => {
        dayRevenue += (sale.total || 0);
        const saleRev = (Number(sale.total || 0) - (Number(sale.taxAmount) || 0));
        let saleCost = 0;
        if (sale.items) {
          sale.items.forEach(item => {
            let itemCost = item.cost;
            if (itemCost === undefined || itemCost === null) {
              const product = products.find(p => (p._id || p.id) === (item.productId || item.product || item.id));
              if (product) itemCost = product.cost || 0;
            }
            // Use fallback of 0 if cost is not available across all systems
            saleCost += (Number(itemCost || 0) * (Number(item.quantity) || 1));
          });
        }
        dayProfit += (saleRev - saleCost);
      });

      return {
        date: dateStr,
        sales: dayRevenue, // Kept 'sales' for backwards compatibility
        revenue: dayRevenue,
        profit: dayProfit,
        orders: daySales.length,
        customers: new Set(daySales.map(s => s.customerId).filter(Boolean)).size
      };
    });
  }, [sales, products, timeRange]);

  // Calculate growth
  const calculateGrowth = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous * 100);
  };

  const todayGrowth = calculateGrowth(metrics.todayIncome, metrics.yesterdayIncome);

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    setIsRefreshing(false);
  };

  // Handle time range change
  const handleTimeRangeChange = (e) => {
    setTimeRange(e.target.value);
  };

  if (isRefreshing) {
    return (
      <Center h="calc(100vh - 100px)">
        <VStack spacing={4}>
          <Spinner size="xl" color="brand.500" thickness="4px" speed="0.65s" />
          <Text color="gray.500">Refreshing dashboard...</Text>
        </VStack>
      </Center>
    );
  }

  return (
    <Box
      bg={bg}
      minH="calc(100vh - 100px)"
      p={{ base: 4, lg: 6 }}
      position="relative"
      overflow="hidden"
    >
      {/* Animated Background Gradient */}
      <Box
        position="absolute"
        top="-50%"
        left="-50%"
        w="200%"
        h="200%"
        bgGradient="radial(circle at 30% 50%, brand.50 0%, transparent 50%)"
        opacity={0.3}
        pointerEvents="none"
        animation="float 20s ease-in-out infinite"
        sx={{
          '@keyframes float': {
            '0%, 100%': { transform: 'translate(0, 0) rotate(0deg)' },
            '33%': { transform: 'translate(30px, -30px) rotate(120deg)' },
            '66%': { transform: 'translate(-20px, 20px) rotate(240deg)' }
          }
        }}
      />

      {/* Header with Animation */}
      <SlideFade in={true} offsetY="-20px">
        <Flex
          direction={{ base: 'column', md: 'row' }}
          justify="space-between"
          align={{ base: 'start', md: 'center' }}
          mb={{ base: 6, lg: 8 }}
          gap={4}
          position="relative"
          zIndex={1}
        >
          <Box>
            <Heading
              size={{ base: 'lg', md: 'xl' }}
              mb={2}
              bgGradient="linear(to-r, gray.800, brand.600)"
              bgClip="text"
              fontWeight="900"
              letterSpacing="tight"
            >
              Dashboard Overview
            </Heading>
            <Text color="gray.500" fontSize={{ base: 'sm', md: 'md' }} fontWeight="500">
              Welcome back, <Text as="span" color="brand.600" fontWeight="700">{user?.name || 'User'}</Text>!
            </Text>
          </Box>
          <HStack spacing={3} w={{ base: 'full', md: 'auto' }}>
            <Select
              size="md"
              flex={{ base: 1, md: 'initial' }}
              w={{ base: 'full', md: '160px' }}
              value={timeRange}
              onChange={handleTimeRangeChange}
              variant="filled"
              bg="white"
              borderRadius="xl"
              fontWeight="500"
              _hover={{ bg: 'gray.50' }}
              _focus={{ bg: 'white', borderColor: 'brand.500' }}
              shadow="sm"
            >
              <option value="7days">Last 7 days</option>
              <option value="30days">Last 30 days</option>
              <option value="90days">Last 90 days</option>
            </Select>
            <IconButton
              icon={<RefreshCw size={20} />}
              onClick={handleRefresh}
              isLoading={isRefreshing}
              aria-label="Refresh Data"
              variant="ghost"
              colorScheme="brand"
              bg="white"
              borderRadius="xl"
              boxShadow="sm"
              border="1px solid"
              borderColor="gray.200"
              _hover={{
                bg: 'gray.50',
                transform: 'rotate(180deg)',
                borderColor: 'brand.500',
                color: 'brand.600'
              }}
              transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
            />
          </HStack>
        </Flex>
      </SlideFade>

      {/* Top Metrics with Staggered Animation */}
      <Fade in={true}>
        <SimpleGrid columns={{ base: 1, md: 2, lg: (user?.role === 'admin' ? 5 : 4) }} spacing={6} mb={8} position="relative" zIndex={1}>
          <MetricCard
            title="Today's Revenue"
            value={`₹${metrics.todayIncome.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
            change={`${metrics.todayGrowth >= 0 ? '+' : ''}${metrics.todayGrowth ? metrics.todayGrowth.toFixed(1) : 0}%`}
            trend={metrics.todayGrowth >= 0 ? 'up' : 'down'}
            icon={DollarSign}
            colorScheme="brand"
            onClick={() => navigate('/sales')}
            subtitle={`${sales.filter(s => isToday(new Date(s.date)) && s.status === 'completed').length} orders`}
          />

          {/* Profit Card - Visible only to Admin */}
          {(user?.role === 'admin') && (
            <MetricCard
              title="Net Profit"
              value={`₹${metrics.netProfit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
              change={`${metrics.profitMargin}% margin`}
              trend={metrics.netProfit >= 0 ? 'up' : 'down'}
              icon={TrendingUpIcon}
              colorScheme={metrics.netProfit >= 0 ? "green" : "red"}
              onClick={() => navigate('/sales')}
              subtitle="All time"
            />
          )}

          <MetricCard
            title="Pending Orders"
            value={metrics.pendingIncome > 0 ? `₹${metrics.pendingIncome.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : "₹0"}
            change={`${sales.filter(s => s.status === 'pending').length} orders`}
            trend="neutral"
            icon={Clock}
            colorScheme="yellow"
            onClick={() => navigate('/sales')}
            subtitle="Awaiting payment"
          />
          <MetricCard
            title="Stock Alerts"
            value={`${metrics.lowStockCount + metrics.outOfStockCount}`}
            change={`${metrics.lowStockCount} low, ${metrics.outOfStockCount} out`}
            trend="down"
            icon={AlertTriangle}
            colorScheme="red"
            onClick={() => navigate('/inventory')}
            subtitle="Needs attention"
          />
          <MetricCard
            title="Total Customers"
            value={metrics.totalCustomers}
            change={`${metrics.customerGrowth ? metrics.customerGrowth.toFixed(1) : 0}% growth`}
            trend="up"
            icon={Users}
            colorScheme="green"
            onClick={() => navigate('/customers')}
            subtitle="Active customers"
          />
        </SimpleGrid>
      </Fade>

      {/* Charts Row 1 */}
      <SlideFade in={true} offsetY="20px" delay={0.2}>
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mb={6} position="relative" zIndex={1}>
          <Box>
            <RevenueChart data={chartData} timeRange={timeRange} />
          </Box>
          <Box>
            <OrdersChart data={chartData} />
          </Box>
        </SimpleGrid>
      </SlideFade>

      {/* Charts Row 2 */}
      <SlideFade in={true} offsetY="20px" delay={0.3}>
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mb={6} position="relative" zIndex={1}>
          <Box>
            <TopProductsDonutChart products={products} />
          </Box>
          <Box>
            <CustomerAnalyticsChart customers={customers} sales={sales} />
          </Box>
        </SimpleGrid>
      </SlideFade>

      {/* Bottom Row */}
      <SlideFade in={true} offsetY="20px" delay={0.4}>
        <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6} mb={6} position="relative" zIndex={1}>
          <Box gridColumn={{ lg: "span 1" }}>
            <RecentActivity sales={sales} />
          </Box>
          <Box gridColumn={{ lg: "span 1" }}>
            <PerformanceMetrics metrics={metrics} />
          </Box>
          <Box gridColumn={{ lg: "span 1" }}>
            <Stack spacing={4}>
              <QuickStats metrics={metrics} />
              <QuickActions navigate={navigate} hasPermission={hasPermission} />
            </Stack>
          </Box>
        </SimpleGrid>
      </SlideFade>

      {/* Footer Info */}
      <Fade in={true} delay={0.5}>
        <Box mt={6} pt={6} borderTop="1px solid" borderColor="gray.200" position="relative" zIndex={1}>
          <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
            <Flex align="center" gap={2}>
              <Icon as={Clock} size={14} color="gray.400" />
              <Text fontSize="xs" color="gray.500" fontWeight="500">
                Last updated: {format(new Date(), 'MMM d, yyyy hh:mm a')}
              </Text>
            </Flex>
            <Flex align="center" gap={2}>
              <Icon as={Calendar} size={14} color="gray.400" />
              <Text fontSize="xs" color="gray.500" fontWeight="500">
                Data range: {format(subDays(new Date(), timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 90), 'MMM d')} - {format(new Date(), 'MMM d')}
              </Text>
            </Flex>
          </Flex>
        </Box>
      </Fade>
    </Box>
  );
}
