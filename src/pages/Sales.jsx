import React, { useState, useMemo } from 'react';
import {
    Box, Heading, Tabs, TabList, TabPanels, Tab, TabPanel,
    Table, Thead, Tbody, Tr, Th, Td, Badge, Button, Flex, Text,
    Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon,
    Card, CardBody, SimpleGrid, Input, InputGroup, InputLeftElement,
    Select, HStack, VStack, IconButton, Menu, MenuButton, MenuList,
    MenuItem, Modal, ModalOverlay, ModalContent, ModalHeader,
    ModalBody, ModalFooter, useDisclosure, Stat, StatLabel,
    StatNumber, StatHelpText, Tooltip, Divider, Alert, AlertIcon,
    AlertDescription, Progress, useToast, SlideFade, ScaleFade,
    useColorModeValue, useBreakpointValue
} from '@chakra-ui/react';
import {
    CheckCircle, XCircle, Download, Upload, Search,
    TrendingUp, TrendingDown, Eye, Printer, FileText, BarChart3, RefreshCw,
    Package, User, ChevronDown, ChevronUp, DollarSign, Calendar, Clock
} from 'lucide-react';
import { useApp } from '../hooks/useApp';
import {
    ResponsiveContainer, LineChart, Line, XAxis, YAxis,
    CartesianGrid, Tooltip as RechartsTooltip, Legend, BarChart, Bar, AreaChart, Area
} from 'recharts';
import { format, parseISO, subDays, startOfDay, endOfDay, isValid } from 'date-fns';
import * as XLSX from 'xlsx';

export default function Sales() {
    const { sales = [], products = [], completePendingSale, cancelSale, hasPermission, user } = useApp(); // Default sales to empty array
    const [activeTab, setActiveTab] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('date');
    const [sortOrder, setSortOrder] = useState('desc');
    const [selectedSale, setSelectedSale] = useState(null);
    const [isExporting, setIsExporting] = useState(false);
    const [isCompleting, setIsCompleting] = useState({});

    const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();
    const { isOpen: isStatsOpen, onOpen: onStatsOpen, onClose: onStatsClose } = useDisclosure();
    const { isOpen: isRefundOpen, onOpen: onRefundOpen, onClose: onRefundClose } = useDisclosure(); // [FEATURE #3]
    const [refundReason, setRefundReason] = useState('');
    const [refundMethod, setRefundMethod] = useState('cash');
    const [isRefunding, setIsRefunding] = useState(false);
    const toast = useToast();
    const isMobile = useBreakpointValue({ base: true, md: false });
    const bg = useColorModeValue('gray.50', 'gray.900');

    const handleCompleteSale = async (id) => {
        setIsCompleting(prev => ({ ...prev, [id]: true }));
        try {
            await completePendingSale(id);
            toast({ title: 'Sale marked as completed', status: 'success', duration: 2000 });
        } catch (error) {
            toast({ title: 'Failed to complete sale', description: error.message, status: 'error', duration: 3000 });
        } finally {
            setIsCompleting(prev => ({ ...prev, [id]: false }));
        }
    };

    // [FEATURE #3] Handle Refund
    const handleRefund = async () => {
        if (!selectedSale) return;
        setIsRefunding(true);
        try {
            const api = (await import('../services/api')).default;
            await api.post(`/sales/${selectedSale._id || selectedSale.id}/refund`, {
                reason: refundReason,
                refundMethod
            });
            toast({ title: '✅ Refund processed', description: `₹${(selectedSale.total || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })} will be returned via ${refundMethod}.`, status: 'success', duration: 5000 });
            onRefundClose();
            onDetailClose();
            // Reload sales list
            window.dispatchEvent(new Event('sme360:refresh'));
        } catch (error) {
            toast({ title: 'Refund failed', description: error?.response?.data?.message || 'Please try again.', status: 'error', duration: 4000 });
        } finally {
            setIsRefunding(false);
        }
    };

    // [FEATURE #7] Download PDF Receipt
    const handleDownloadReceipt = async (sale) => {
        const id = sale._id || sale.id;
        try {
            const api = (await import('../services/api')).default;
            const response = await api.get(`/sales/${id}/receipt`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;

            // Name formatting: Receipt_JohnDoe_9876543210.pdf or Receipt_WalkInCustomer.pdf
            const custName = sale.customerName ? sale.customerName.replace(/[^a-zA-Z0-9]/g, '') : 'WalkIn';
            const custPhone = sale.customerPhone ? '_' + sale.customerPhone : '';
            const fileName = `Receipt_${custName}${custPhone}.pdf`;

            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            toast({ title: 'Receipt downloaded successfully', status: 'success', duration: 3000 });
        } catch (error) {
            console.error('Download Error:', error);
            toast({ title: 'Failed to download receipt', status: 'error', duration: 3000 });
        }
    };

    // --- Helpers ---
    const formatDateSafe = (dateInput, formatStr = 'MMM dd, HH:mm') => {
        try {
            if (!dateInput) return 'N/A';
            const date = typeof dateInput === 'string' ? parseISO(dateInput) : new Date(dateInput);
            if (!isValid(date)) return 'Invalid Date';
            return format(date, formatStr);
        } catch (e) {
            return 'N/A';
        }
    };

    const getSafeId = (sale) => {
        if (!sale) return '';
        // Handle both _id (backend) and id (local)
        return (sale._id || sale.id || '').toString();
    };

    const formatPaymentMethod = (method) => {
        const raw = (method || 'cash').toString().trim();
        if (!raw) return 'Cash';
        const v = raw.toLowerCase();
        if (v === 'upi') return 'UPI';
        if (v === 'cash') return 'Cash';
        if (v === 'bank_transfer') return 'Bank Transfer';
        if (v === 'card') return 'Card';
        return raw
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (m) => m.toUpperCase());
    };

    // Calculate Profit Helper
    const calculateProfit = (sale) => {
        if (!sale || !sale.items) return null;

        let totalCost = 0;
        let hasCostInfo = false;

        sale.items.forEach(item => {
            let itemCost = item.cost;
            // Fallback: try to find product in current inventory if cost missing in sale
            if (itemCost === undefined || itemCost === null) {
                const product = products.find(p => (p._id || p.id) === (item.productId || item.id || item._id));
                if (product && product.cost) {
                    itemCost = product.cost;
                }
            }

            if (itemCost !== undefined) {
                totalCost += Number(itemCost) * (Number(item.quantity) || 1);
                hasCostInfo = true;
            }
        });

        // If no cost info found at all, return null (or 0 if preferred, but null shows N/A)
        // We will assume 0 cost if some items have cost but others don't, to at least show something.
        // But better to be explicit.

        // Revenue (Net Sales) = Total - Tax. 
        // If subtotal exists, Revenue = Subtotal - Discount. 
        // We prefer (Total - Tax) as it's more robust for historical data where subtotal might be missing but Total is always there.
        const totalAmount = Number(sale.total || sale.totalAmount || 0);
        const taxAmount = Number(sale.taxAmount || 0);
        const revenue = totalAmount - taxAmount;

        const profit = revenue - totalCost;

        return profit;
    };

    // Date range options
    const dateRanges = {
        today: { start: startOfDay(new Date()), end: endOfDay(new Date()) },
        yesterday: { start: startOfDay(subDays(new Date(), 1)), end: endOfDay(subDays(new Date(), 1)) },
        week: { start: startOfDay(subDays(new Date(), 7)), end: endOfDay(new Date()) },
        month: { start: startOfDay(subDays(new Date(), 30)), end: endOfDay(new Date()) }
    };

    // Filter and sort sales
    const filteredSales = useMemo(() => {
        if (!Array.isArray(sales)) return [];

        return sales
            .filter(sale => {
                if (!sale) return false;

                const lowerSearch = searchTerm.toLowerCase();
                const customerName = (sale.customerName || '').toLowerCase();
                const saleId = getSafeId(sale).toLowerCase();
                const matchesSearch = searchTerm === '' || customerName.includes(lowerSearch) || saleId.includes(lowerSearch);

                let matchesDate = true;
                if (dateFilter !== 'all' && dateRanges[dateFilter] && sale.date) {
                    try {
                        const saleDate = typeof sale.date === 'string' ? parseISO(sale.date) : new Date(sale.date);
                        if (isValid(saleDate)) {
                            matchesDate = saleDate >= dateRanges[dateFilter].start && saleDate <= dateRanges[dateFilter].end;
                        } else {
                            matchesDate = false;
                        }
                    } catch (e) { matchesDate = false; }
                }

                const matchesStatus = statusFilter === 'all' || sale.status === statusFilter;
                return matchesSearch && matchesDate && matchesStatus;
            })
            .sort((a, b) => {
                let aValue, bValue;
                switch (sortBy) {
                    case 'date':
                        aValue = new Date(a.date || 0);
                        bValue = new Date(b.date || 0);
                        break;
                    case 'amount':
                        aValue = Number(a.total || 0);
                        bValue = Number(b.total || 0);
                        break;
                    case 'profit': // Add sort by profit
                        aValue = calculateProfit(a) || 0;
                        bValue = calculateProfit(b) || 0;
                        break;
                    case 'gst': // Add sort by GST
                        aValue = Number(a.taxAmount || 0);
                        bValue = Number(b.taxAmount || 0);
                        break;
                    default:
                        aValue = a[sortBy];
                        bValue = b[sortBy];
                }

                if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
                return 0;
            });
    }, [sales, searchTerm, dateFilter, statusFilter, sortBy, sortOrder, products]);

    // ... (render part needs updating too)


    // Statistics
    const stats = useMemo(() => {
        if (!Array.isArray(sales)) return { totalRevenue: 0, avgSaleValue: 0, completedSales: 0, pendingSales: 0, chartData: [], topProducts: [] };

        const completedSales = sales.filter(s => s && s.status === 'completed');
        const pendingSales = sales.filter(s => s && s.status === 'pending');
        const totalRevenue = completedSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
        const totalTax = completedSales.reduce((sum, sale) => sum + (sale.taxAmount || 0), 0);
        const avgSaleValue = completedSales.length > 0 ? totalRevenue / completedSales.length : 0;

        const dailyRevenue = {};
        completedSales.forEach(sale => {
            if (sale.date) {
                try {
                    const dateObj = typeof sale.date === 'string' ? parseISO(sale.date) : new Date(sale.date);
                    if (isValid(dateObj)) {
                        const dateKey = format(dateObj, 'yyyy-MM-dd');
                        dailyRevenue[dateKey] = (dailyRevenue[dateKey] || 0) + (sale.total || 0);
                    }
                } catch (e) { }
            }
        });

        const chartData = Object.entries(dailyRevenue)
            .slice(-7)
            .map(([date, revenue]) => ({
                date: formatDateSafe(date, 'MMM dd'),
                revenue,
                // eslint-disable-next-line
                sales: completedSales.filter(s => {
                    if (!s.date) return false;
                    try { return s.date.includes(date) || format(new Date(s.date), 'yyyy-MM-dd') === date; }
                    catch (e) { return false; }
                }).length
            }));

        const productSales = {};
        completedSales.forEach(sale => {
            (sale.items || []).forEach(item => {
                const id = item.productId || item.product || item.name || 'unknown';
                if (!productSales[id]) productSales[id] = { name: item.productName || item.name || 'Unknown', revenue: 0, qty: 0 };
                productSales[id].revenue += ((item.price || 0) * (item.quantity || 0));
                productSales[id].qty += (item.quantity || 0);
            });
        });

        const topProducts = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

        return { totalRevenue, totalTax, avgSaleValue, completedSales: completedSales.length, pendingSales: pendingSales.length, chartData, topProducts };
    }, [sales]);

    // --- Features ---

    const exportToCSV = () => {
        setIsExporting(true);
        try {
            const data = filteredSales.map(s => {
                const row = {
                    ID: getSafeId(s),
                    Date: format(new Date(s.date), 'yyyy-MM-dd HH:mm'),
                    Customer: s.customerName,
                    Status: s.status,
                    Payment: formatPaymentMethod(s.paymentMethod),
                    Subtotal: (s.subtotal || (s.total - (s.taxAmount || 0) + (s.discountAmount || 0)) || 0).toFixed(2),
                    Discount: (s.discountAmount || 0).toFixed(2),
                    Tax: (s.taxAmount || 0).toFixed(2),
                    Total: (s.total || 0).toFixed(2)
                };
                if (user?.role === 'admin') {
                    const profit = calculateProfit(s);
                    row.Profit = profit !== null ? profit.toFixed(2) : 'N/A';
                }
                return row;
            });

            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Sales');
            XLSX.writeFile(wb, `Sales_${format(new Date(), 'yyyyMMdd')}.xlsx`);
            toast({ title: "Exported!", status: "success" });
        } catch (e) {
            console.error(e);
            toast({ title: "Error exporting", status: "error" });
        }
        setIsExporting(false);
    };

    const exportToPDF = () => {
        setIsExporting(true);
        try {
            const pdfWindow = window.open('', '_blank');
            if (!pdfWindow) throw new Error('Popup blocked');

            const reportDate = format(new Date(), 'yyyy-MM-dd HH:mm');
            const showProfit = user?.role === 'admin';

            const reportHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Sales Report</title>
          <style>
             body { font-family: sans-serif; padding: 20px; font-size: 12px; }
             h1 { color: #0ea5e9; }
             table { width: 100%; border-collapse: collapse; margin-top: 20px; }
             th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
             th { background-color: #f2f2f2; }
             .text-right { text-align: right; }
          </style>
        </head>
        <body>
          <h1>Sales Report</h1>
          <p>Generated: ${reportDate}</p>
          <p><strong>Total Revenue:</strong> ₹${stats.totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })} | <strong>Total Tax:</strong> ₹${stats.totalTax.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
          <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th class="text-right">Tax</th>
                    <th class="text-right">Total</th>
                    ${showProfit ? '<th class="text-right">Profit</th>' : ''}
                </tr>
            </thead>
            <tbody>
              ${filteredSales.map(s => {
                const profit = calculateProfit(s);
                return `
                <tr>
                   <td>${getSafeId(s).substring(0, 8)}</td>
                   <td>${formatDateSafe(s.date)}</td>
                   <td>${s.customerName}</td>
                   <td>${s.status}</td>
                   <td>${formatPaymentMethod(s.paymentMethod)}</td>
                   <td class="text-right">₹${(s.taxAmount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                   <td class="text-right">₹${(s.total || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                   ${showProfit ? `<td class="text-right">${profit !== null ? '₹' + profit.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : 'N/A'}</td>` : ''}
                </tr>
              `;
            }).join('')}
            </tbody>
          </table>
          <script>window.print();</script>
        </body>
        </html>
      `;
            pdfWindow.document.write(reportHTML);
            pdfWindow.document.close();
            toast({ title: "Report Generated", status: "success" });
        } catch (e) {
            console.error(e);
            toast({ title: "Failed to generate PDF", status: "error" });
        } finally {
            setIsExporting(false);
        }
    };

    const printReceipt = (sale) => {
        try {
            if (!sale) return;
            const receiptWindow = window.open('', '_blank');
            if (!receiptWindow) return;

            const receiptHTML = `
        <html><head><title>Receipt</title></head>
        <body style="font-family: monospace; padding: 20px; max-width: 300px; margin: 0 auto;">
          <div style="text-align: center;">
             <h2>SMART POS</h2>
             <p>123 Business St</p>
          </div>
          <hr/>
          <p>Order: #${getSafeId(sale).substring(0, 8)}</p>
          <p>Date: ${formatDateSafe(sale.date)}</p>
          <p>Customer: ${sale.customerName}</p>
          <p>Payment: ${formatPaymentMethod(sale.paymentMethod)}</p>
          <hr/>
          <table style="width: 100%;">
             ${(sale.items || []).map(i => `
               <tr>
                 <td>${i.productName || 'Item'}</td>
                 <td align="right">x${i.quantity || 0}</td>
                 <td align="right">₹${((i.price || 0) * (i.quantity || 0)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
               </tr>
             `).join('')}
          </table>
          <hr/>
          <div style="display:flex; justify-content:space-between; font-weight:bold;">
             <span>TOTAL</span>
             <span>₹${(sale.total || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>
          <div style="text-align:center; margin-top:20px;">Thank You!</div>
          <script>setTimeout(function(){ window.print(); window.close(); }, 500);</script>
        </body></html>
      `;
            receiptWindow.document.write(receiptHTML);
            receiptWindow.document.close();
        } catch (e) {
            console.error(e);
            toast({ title: "Error printing receipt", description: "Browser blocked the popup or an error occurred.", status: "error", duration: 3000 });
        }
    };

    // --- Components ---

    const MobileSaleCard = ({ sale }) => {
        if (!sale) return null;
        return (
            <ScaleFade in={true} initialScale={0.95}>
                <Card mb={3} borderRadius="xl" border="1px solid" borderColor="gray.100" shadow="sm">
                    <CardBody p={4}>
                        <Flex justify="space-between" mb={2}>
                            <HStack>
                                <Badge colorScheme={sale.status === 'completed' ? 'green' : 'orange'} borderRadius="full" px={2}>
                                    {sale.status}
                                </Badge>
                                <Badge variant="subtle" borderRadius="full" px={2} colorScheme={(sale.paymentMethod || '').toString().toLowerCase() === 'upi' ? 'blue' : 'gray'}>
                                    {formatPaymentMethod(sale.paymentMethod)}
                                </Badge>
                                <Text fontSize="xs" color="gray.500">#{getSafeId(sale).substring(0, 8)}</Text>
                            </HStack>
                            <Text fontWeight="bold" color="brand.600">₹{(sale.total || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
                        </Flex>
                        <HStack mb={2}>
                            <User size={14} color="gray" />
                            <Text fontWeight="600" fontSize="sm">{sale.customerName || 'Unknown'}</Text>
                        </HStack>
                        <HStack justify="space-between" fontSize="xs" color="gray.500" mb={3}>
                            <Text>{formatDateSafe(sale.date, 'PP p')}</Text>
                            <Text>{(sale.items || []).length} Items</Text>
                        </HStack>
                        <Divider mb={3} />
                        <Flex justify="flex-end" gap={2}>
                            <IconButton size="sm" icon={<Printer size={14} />} variant="ghost" onClick={() => printReceipt(sale)} aria-label="Print" />
                            <Button size="sm" variant="ghost" leftIcon={<Eye size={14} />} onClick={() => { setSelectedSale(sale); onDetailOpen(); }}>View</Button>
                            {sale.status === 'pending' && hasPermission('canManageSales') && (
                                <Button size="sm" colorScheme="green" onClick={() => handleCompleteSale(getSafeId(sale))} isLoading={isCompleting[getSafeId(sale)]}>Complete</Button>
                            )}
                        </Flex>
                    </CardBody>
                </Card>
            </ScaleFade>
        );
    };

    return (
        <Box minH="calc(100vh - 80px)" bg={bg} p={{ base: 2, md: 6 }}>

            {/* Header */}
            <SlideFade in={true} offsetY="-20px">
                <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ base: 'start', md: 'center' }} mb={8} gap={4}>
                    <Box>
                        <Heading size="lg" color="gray.800" fontWeight="700" letterSpacing="-0.5px">
                            Sales History
                        </Heading>
                        <Text color="gray.500" fontSize="sm" mt={1}>
                            Track and manage all your business transactions
                        </Text>
                    </Box>
                    <HStack spacing={3} w={{ base: 'full', md: 'auto' }} wrap={{ base: 'wrap', sm: 'nowrap' }}>
                        <Button
                            leftIcon={<BarChart3 size={18} />}
                            onClick={onStatsOpen}
                            flex={{ base: '1', sm: 'initial' }}
                        >
                            Analytics
                        </Button>
                        <Menu>
                        <MenuButton
                            as={Button}
                            leftIcon={<Upload size={18} />}
                            colorScheme="brand"
                            flex={{ base: '1', sm: 'initial' }}
                            w={{ base: 'full', sm: 'auto' }}
                            isLoading={isExporting}
                        >
                            Export
                        </MenuButton>
                            <MenuList>
                                <MenuItem icon={<FileText size={16} />} onClick={exportToCSV}>Excel Report</MenuItem>
                                <MenuItem icon={<Printer size={16} />} onClick={exportToPDF}>PDF Report</MenuItem>
                            </MenuList>
                        </Menu>
                    </HStack>
                </Flex>
            </SlideFade>

            {/* Stats Overview */}
            <SimpleGrid columns={{ base: 1, md: 2, lg: 5 }} spacing={4} mb={6}>
                {[
                    { label: 'Total Revenue', value: stats.totalRevenue, icon: DollarSign, color: 'blue' },
                    { label: 'Total GST Collected', value: stats.totalTax, icon: FileText, color: 'red' },
                    { label: 'Completed Sales', value: stats.completedSales, icon: CheckCircle, color: 'green' },
                    { label: 'Pending Orders', value: stats.pendingSales, icon: Clock, color: 'orange' },
                    { label: 'Avg Sale Value', value: stats.avgSaleValue, icon: TrendingUp, color: 'purple' }
                ].map((stat, idx) => (
                    <ScaleFade in={true} delay={idx * 0.1} key={idx}>
                        <Card
                            borderRadius="xl"
                            border="1px solid"
                            borderColor="gray.200"
                            shadow="sm"
                            _hover={{ shadow: 'md', borderColor: 'brand.300', transform: 'translateY(-2px)' }}
                            transition="all 0.2s"
                        >
                            <CardBody display="flex" alignItems="center" gap={4}>
                                <Flex
                                    w="48px"
                                    h="48px"
                                    bg={`${stat.color}.50`}
                                    borderRadius="xl"
                                    align="center"
                                    justify="center"
                                    color={`${stat.color}.500`}
                                    border="1px solid"
                                    borderColor={`${stat.color}.100`}
                                >
                                    <stat.icon size={22} />
                                </Flex>
                                <Box>
                                    <Text color="gray.500" fontSize="xs" fontWeight="600" textTransform="uppercase" letterSpacing="wide">{stat.label}</Text>
                                    <Heading size="md" color="gray.800" mt={1}>
                                        {typeof stat.value === 'number' && (stat.label.includes('Sales') || stat.label.includes('Orders')) ? stat.value : `₹${stat.value.toFixed(0)}`}
                                    </Heading>
                                </Box>
                            </CardBody>
                        </Card>
                    </ScaleFade>
                ))}
            </SimpleGrid>

            {/* Filters & Controls */}
            <Card mb={6} borderRadius="2xl" shadow="sm">
                <CardBody p={4}>
                    <Flex direction={{ base: 'column', lg: 'row' }} gap={4}>
                        <InputGroup flex={1}>
                            <InputLeftElement><Search color="gray" /></InputLeftElement>
                            <Input placeholder="Search customer, ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} borderRadius="xl" />
                        </InputGroup>
                        <HStack overflowX="auto" spacing={2} pb={{ base: 2, lg: 0 }}>
                            <Select borderRadius="xl" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} w="150px">
                                <option value="all">All Dates</option>
                                <option value="today">Today</option>
                                <option value="week">This Week</option>
                            </Select>
                            <Select borderRadius="xl" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} w="150px">
                                <option value="all">All Status</option>
                                <option value="completed">Paid</option>
                                <option value="pending">Pending</option>
                            </Select>
                            <IconButton icon={sortOrder === 'desc' ? <ChevronDown /> : <ChevronUp />} onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')} borderRadius="xl" aria-label="Sort" />
                        </HStack>
                    </Flex>
                </CardBody>
            </Card>

            {/* Main List / Table */}
            <Box>
                {filteredSales.length === 0 ? (
                    <Flex direction="column" align="center" justify="center" h="300px" bg="white" borderRadius="2xl" border="1px dashed" borderColor="gray.300">
                        <Box p={4} bg="gray.50" borderRadius="full" mb={4}><Search size={32} color="gray" /></Box>
                        <Heading size="md" color="gray.500">No Sales Found</Heading>
                        <Text color="gray.400">Try adjusting your filters</Text>
                    </Flex>
                ) : (
                    isMobile ? (
                        <Box>
                            {filteredSales.map(sale => <MobileSaleCard key={getSafeId(sale)} sale={sale} />)}
                        </Box>
                    ) : (
                        <Card borderRadius="xl" border="1px solid" borderColor="gray.100" shadow="sm" overflow="hidden">
                            <Table variant="simple" size="md">
                                <Thead bg="gray.50">
                                    <Tr>
                                        <Th py={4} textTransform="uppercase" fontSize="xs" letterSpacing="wider" color="gray.500">ID</Th>
                                        <Th py={4} textTransform="uppercase" fontSize="xs" letterSpacing="wider" color="gray.500">Customer</Th>
                                        <Th py={4} textTransform="uppercase" fontSize="xs" letterSpacing="wider" color="gray.500">Date</Th>
                                        <Th py={4} textTransform="uppercase" fontSize="xs" letterSpacing="wider" color="gray.500">Status</Th>
                                        <Th py={4} textTransform="uppercase" fontSize="xs" letterSpacing="wider" color="gray.500">Payment</Th>
                                        <Th py={4} textTransform="uppercase" fontSize="xs" letterSpacing="wider" color="gray.500" isNumeric>Amount</Th>
                                        <Th py={4} textTransform="uppercase" fontSize="xs" letterSpacing="wider" color="gray.500" isNumeric onClick={() => { if (sortBy === 'gst') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); else { setSortBy('gst'); setSortOrder('desc'); } }} cursor="pointer">
                                            GST {sortBy === 'gst' && (sortOrder === 'asc' ? '↑' : '↓')}
                                        </Th>
                                        {(user?.role === 'admin') && (
                                            <Th py={4} textTransform="uppercase" fontSize="xs" letterSpacing="wider" color="gray.500" isNumeric onClick={() => { if (sortBy === 'profit') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); else { setSortBy('profit'); setSortOrder('desc'); } }} cursor="pointer">
                                                Profit {sortBy === 'profit' && (sortOrder === 'asc' ? '↑' : '↓')}
                                            </Th>
                                        )}
                                        <Th py={4} textTransform="uppercase" fontSize="xs" letterSpacing="wider" color="gray.500">Actions</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {filteredSales.map(sale => (
                                        <Tr key={getSafeId(sale)} _hover={{ bg: 'blue.50' }} transition="all 0.2s">
                                            <Td fontSize="sm" fontFamily="mono" color="gray.600" fontWeight="500">
                                                <Tooltip label={getSafeId(sale)}>#{getSafeId(sale).substring(0, 6)}</Tooltip>
                                            </Td>
                                            <Td fontWeight="600" color="gray.700">{sale.customerName || 'Unknown'}</Td>
                                            <Td fontSize="sm" color="gray.500">{formatDateSafe(sale.date)}</Td>
                                            <Td>
                                                <Badge
                                                    colorScheme={
                                                        sale.status === 'completed' ? 'green' :
                                                            sale.status === 'refunded' ? 'purple' :
                                                                sale.status === 'cancelled' ? 'red' : 'orange'
                                                    }
                                                    variant="subtle"
                                                    borderRadius="full"
                                                    px={3}
                                                    py={1}
                                                    textTransform="capitalize"
                                                >
                                                    {sale.status}
                                                </Badge>
                                            </Td>
                                            <Td fontSize="sm" color="gray.600" fontWeight="600">
                                                {formatPaymentMethod(sale.paymentMethod)}
                                            </Td>
                                            <Td isNumeric fontWeight="700" color="brand.600">₹{(sale.total || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Td>
                                            <Td isNumeric color="gray.600">₹{(sale.taxAmount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Td>
                                            {user?.role === 'admin' && (
                                                <Td isNumeric fontWeight="600" color={(calculateProfit(sale) || 0) >= 0 ? 'green.600' : 'red.500'}>
                                                    {calculateProfit(sale) !== null
                                                        ? `₹${(calculateProfit(sale)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
                                                        : <Text as="span" color="gray.400" fontSize="xs">N/A</Text>
                                                    }
                                                </Td>
                                            )}
                                            <Td>
                                                <HStack justify="flex-end">
                                                    <IconButton size="sm" icon={<Printer size={16} />} onClick={() => printReceipt(sale)} variant="ghost" colorScheme="gray" aria-label="Print Receipt" borderRadius="full" />
                                                    <IconButton size="sm" icon={<Eye size={16} />} onClick={() => { setSelectedSale(sale); onDetailOpen(); }} variant="ghost" colorScheme="blue" aria-label="View Details" borderRadius="full" />
                                                    {sale.status === 'pending' && <IconButton size="sm" icon={<CheckCircle size={16} />} colorScheme="green" variant="ghost" onClick={() => handleCompleteSale(getSafeId(sale))} isLoading={isCompleting[getSafeId(sale)]} aria-label="Complete Sale" borderRadius="full" />}
                                                </HStack>
                                            </Td>
                                        </Tr>
                                    ))}
                                </Tbody>
                            </Table>
                        </Card>
                    )
                )}
            </Box>

            {/* Sale Details Modal */}
            <Modal isOpen={isDetailOpen} onClose={onDetailClose} size="lg" isCentered>
                <ModalOverlay backdropFilter="blur(5px)" />
                <ModalContent borderRadius="2xl">
                    <ModalHeader borderBottom="1px solid" borderColor="gray.100">Sale Details</ModalHeader>
                    <ModalBody p={6}>
                        {selectedSale && (
                            <VStack spacing={4} align="stretch">
                                <Box p={4} bg="gray.50" borderRadius="xl">
                                    <Flex justify="space-between" mb={2}>
                                        <Text color="gray.500">Customer</Text>
                                        <Text fontWeight="bold">{selectedSale.customerName || 'Unknown'}</Text>
                                    </Flex>
                                    <Flex justify="space-between">
                                        <Text color="gray.500">Date</Text>
                                        <Text fontWeight="bold">{formatDateSafe(selectedSale.date, 'PPP p')}</Text>
                                    </Flex>
                                    <Flex justify="space-between" mt={2}>
                                        <Text color="gray.500">Payment</Text>
                                        <Text fontWeight="bold">{formatPaymentMethod(selectedSale.paymentMethod)}</Text>
                                    </Flex>
                                </Box>

                                <Divider />
                                <Text fontWeight="bold" fontSize="lg">Items</Text>
                                <VStack spacing={3} align="stretch">
                                    {(selectedSale.items || []).map((item, i) => (
                                        <Flex key={i} justify="space-between">
                                            <Box>
                                                <Text fontWeight="600">{item.productName || 'Item'}</Text>
                                                <Text fontSize="xs" color="gray.500">{item.quantity} x ₹{item.price}</Text>
                                            </Box>
                                            <Text fontWeight="bold">₹{((item.price || 0) * (item.quantity || 0)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
                                        </Flex>
                                    ))}
                                </VStack>
                                <Divider />
                                <VStack spacing={1} align="stretch" pt={2}>
                                    <Flex justify="space-between">
                                        <Text color="gray.500">Subtotal</Text>
                                        <Text>₹{(selectedSale.subtotal || (selectedSale.total - (selectedSale.taxAmount || 0) + (selectedSale.discountAmount || 0)) || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
                                    </Flex>
                                    {selectedSale.discountAmount > 0 && (
                                        <Flex justify="space-between">
                                            <Text color="gray.500">Discount</Text>
                                            <Text color="green.500">-₹{(selectedSale.discountAmount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
                                        </Flex>
                                    )}
                                    {selectedSale.taxAmount > 0 && (
                                        <Flex justify="space-between">
                                            <Text color="gray.500">GST / Tax</Text>
                                            <Text>₹{(selectedSale.taxAmount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
                                        </Flex>
                                    )}
                                </VStack>
                                <Divider />
                                <Flex justify="space-between" align="center" py={2}>
                                    <Text fontSize="lg" fontWeight="bold">Total Amount</Text>
                                    <Heading size="md" color="brand.600">₹{(selectedSale.total || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Heading>
                                </Flex>
                            </VStack>
                        )}
                    </ModalBody>
                    <ModalFooter
                        bg="gray.50"
                        borderTopRadius="0"
                        borderBottomRadius="2xl"
                        pt={4}
                        pb={{ base: 'calc(env(safe-area-inset-bottom) + 16px)', md: 4 }}
                    >
                        <VStack w="full" spacing={3} align="stretch" display={{ base: 'flex', md: 'none' }}>
                            <Button w="full" onClick={onDetailClose}>Close</Button>
                            <Button w="full" colorScheme="brand" leftIcon={<Printer size={16} />} onClick={() => printReceipt(selectedSale)}>
                                Print Receipt
                            </Button>
                            <Button
                                w="full"
                                colorScheme="blue"
                                variant="outline"
                                leftIcon={<Download size={18} />}
                                onClick={() => handleDownloadReceipt(selectedSale)}
                            >
                                Download PDF
                            </Button>
                            {selectedSale?.status === 'completed' && hasPermission('canManageSales') && (
                                <Button
                                    w="full"
                                    colorScheme="red"
                                    variant="outline"
                                    onClick={() => {
                                        const orig = (selectedSale?.paymentMethod || 'cash').toString().toLowerCase();
                                        setRefundMethod(orig === 'upi' ? 'upi' : 'cash');
                                        onRefundOpen();
                                    }}
                                >
                                    Process Refund
                                </Button>
                            )}
                        </VStack>
                        <Button mr={3} onClick={onDetailClose} display={{ base: 'none', md: 'inline-flex' }}>Close</Button>
                        <Button colorScheme="brand" leftIcon={<Printer size={16} />} onClick={() => printReceipt(selectedSale)} display={{ base: 'none', md: 'inline-flex' }}>Print Receipt</Button>
                        <Tooltip label="Download PDF Receipt">
                            <IconButton
                                ml={2}
                                colorScheme="blue"
                                variant="outline"
                                icon={<Download size={18} />}
                                onClick={() => handleDownloadReceipt(selectedSale)}
                                aria-label="Download PDF"
                                display={{ base: 'none', md: 'inline-flex' }}
                            />
                        </Tooltip>
                        {/* [FEATURE #3] Refund Button — only for completed sales */}
                        {selectedSale?.status === 'completed' && hasPermission('canManageSales') && (
                            <Button
                                ml={2}
                                colorScheme="red"
                                variant="outline"
                                display={{ base: 'none', md: 'inline-flex' }}
                                onClick={() => {
                                    const orig = (selectedSale?.paymentMethod || 'cash').toString().toLowerCase();
                                    setRefundMethod(orig === 'upi' ? 'upi' : 'cash');
                                    onRefundOpen();
                                }}
                            >
                                Process Refund
                            </Button>
                        )}
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Analytics Modal */}
            <Modal isOpen={isStatsOpen} onClose={onStatsClose} size="3xl" isCentered>
                <ModalOverlay backdropFilter="blur(5px)" />
                <ModalContent borderRadius="3xl">
                    <ModalHeader>Performance Analytics</ModalHeader>
                    <ModalBody p={6}>
                        <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
                            <Card variant="outline" borderRadius="2xl">
                                <CardBody>
                                    <Text fontWeight="bold" mb={4}>Revenue Trend (7 Days)</Text>
                                    <Box h="200px">
                                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                            <AreaChart data={stats.chartData}>
                                                <defs>
                                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#3182ce" stopOpacity={0.8} />
                                                        <stop offset="95%" stopColor="#3182ce" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <XAxis dataKey="date" axisLine={false} tickLine={false} />
                                                <RechartsTooltip />
                                                <Area type="monotone" dataKey="revenue" stroke="#3182ce" fillOpacity={1} fill="url(#colorRev)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </Box>
                                </CardBody>
                            </Card>
                            <Card variant="outline" borderRadius="2xl">
                                <CardBody>
                                    <Text fontWeight="bold" mb={4}>Top Products</Text>
                                    <VStack align="stretch" spacing={3}>
                                        {stats.topProducts.map((p, i) => (
                                            <Flex key={i} justify="space-between" align="center">
                                                <Text fontSize="sm" fontWeight="medium">{p.name}</Text>
                                                <Text fontSize="sm" fontWeight="bold">₹{p.revenue.toFixed(0)}</Text>
                                            </Flex>
                                        ))}
                                    </VStack>
                                </CardBody>
                            </Card>
                        </SimpleGrid>
                    </ModalBody>
                    <ModalFooter>
                        <Button onClick={onStatsClose} mr={3}>Close</Button>
                        <Button colorScheme="brand" onClick={exportToPDF} leftIcon={<Upload size={16} />} isLoading={isExporting} loadingText="Downloading...">Download Report</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
            {/* [FEATURE #3] Refund Confirmation Modal */}
            <Modal isOpen={isRefundOpen} onClose={onRefundClose} isCentered>
                <ModalOverlay backdropFilter="blur(5px)" />
                <ModalContent borderRadius="2xl">
                    <ModalHeader color="red.600">Process Refund</ModalHeader>
                    <ModalBody>
                        <VStack spacing={4} align="stretch">
                            <Alert status="warning" borderRadius="lg">
                                <AlertIcon />
                                <AlertDescription fontSize="sm">
                                    This will <strong>restore stock</strong> and reverse ₹{(selectedSale?.total || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })} from the customer's account.
                                </AlertDescription>
                            </Alert>
                            <Box>
                                <Text fontSize="sm" fontWeight="600" mb={1} color="gray.600">Refund Method</Text>
                                <Select value={refundMethod} onChange={e => setRefundMethod(e.target.value)} borderRadius="lg">
                                    <option value="cash">Cash</option>
                                    <option value="upi">UPI</option>
                                </Select>
                            </Box>
                            <Box>
                                <Text fontSize="sm" fontWeight="600" mb={1} color="gray.600">Reason for Refund</Text>
                                <Input
                                    placeholder="e.g. Item damaged, wrong item received..."
                                    value={refundReason}
                                    onChange={e => setRefundReason(e.target.value)}
                                    borderRadius="lg"
                                />
                            </Box>
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onRefundClose}>Cancel</Button>
                        <Button
                            colorScheme="red"
                            onClick={handleRefund}
                            isLoading={isRefunding}
                            loadingText="Processing..."
                        >
                            Confirm Refund
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

        </Box>
    );
}
