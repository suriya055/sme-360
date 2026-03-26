import React, { useState, useEffect } from 'react';
import {
    Box, Flex, Text, Heading, Button, Table, Thead, Tbody, Tr, Th, Td, Badge,
    useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton,
    ModalBody, ModalFooter, FormControl, FormLabel, Input, Select, VStack, HStack,
    useColorModeValue, IconButton, Tooltip, Tabs, TabList, TabPanels, Tab, TabPanel,
    NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper,
    Alert, Card, CardBody, useBreakpointValue
} from '@chakra-ui/react';
import { FileDown, Edit2, Wallet, Users, FileText, CheckCircle } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function Payroll() {
    const [employees, setEmployees] = useState([]);
    const [payslips, setPayslips] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

    // Modals
    const { isOpen: isSalaryOpen, onOpen: onSalaryOpen, onClose: onSalaryClose } = useDisclosure();
    const { isOpen: isPayslipOpen, onOpen: onPayslipOpen, onClose: onPayslipClose } = useDisclosure();
    const { isOpen: isPayOpen, onOpen: onPayOpen, onClose: onPayClose } = useDisclosure();

    const [selectedEmp, setSelectedEmp] = useState(null);
    const [selectedPayslip, setSelectedPayslip] = useState(null);
    const [salaryForm, setSalaryForm] = useState({ baseSalary: 0, salaryType: 'monthly' });
    const [payslipForm, setPayslipForm] = useState({ basicPay: 0, allowances: 0, deductions: 0, notes: '' });
    const [paymentForm, setPaymentForm] = useState({ paymentMethod: 'bank_transfer', data: '' });

    const bg = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const isMobile = useBreakpointValue({ base: true, md: false });

    useEffect(() => {
        fetchData();
    }, [selectedMonth]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [empRes, slipRes] = await Promise.all([
                api.get('/payroll/employees'),
                api.get(`/payroll/payslips?month=${selectedMonth}`)
            ]);
            setEmployees(empRes.data);
            setPayslips(slipRes.data);
        } catch (err) {
            toast.error('Failed to load payroll data');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateSalary = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/payroll/employees/${selectedEmp._id}`, salaryForm);
            toast.success('Salary updated');
            onSalaryClose();
            fetchData();
        } catch (err) {
            toast.error('Failed to update salary');
        }
    };

    const handleGeneratePayslip = async (e) => {
        e.preventDefault();
        try {
            await api.post('/payroll/payslips', {
                userId: selectedEmp._id,
                month: selectedMonth,
                ...payslipForm
            });
            toast.success('Payslip generated');
            onPayslipClose();
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to generate payslip');
        }
    };

    const handlePay = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/payroll/payslips/${selectedPayslip._id}/pay`, paymentForm);
            toast.success('Payslip status updated to Paid');
            onPayClose();
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to record payment');
        }
    };

    const openSalaryModal = (emp) => {
        setSelectedEmp(emp);
        setSalaryForm({
            baseSalary: emp.payroll?.baseSalary || 0,
            salaryType: emp.payroll?.salaryType || 'monthly'
        });
        onSalaryOpen();
    };

    const openPayslipModal = (emp) => {
        setSelectedEmp(emp);
        // Auto-fill basic pay with base salary if creating new
        setPayslipForm({
            basicPay: emp.payroll?.baseSalary || 0,
            allowances: 0,
            deductions: 0,
            notes: ''
        });
        onPayslipOpen();
    };

    const EmployeeCard = ({ emp }) => (
        <Card borderRadius="2xl" borderWidth="1px" borderColor={borderColor} overflow="hidden">
            <CardBody p={4}>
                <Flex justify="space-between" align="flex-start" gap={3}>
                    <Box minW={0}>
                        <Text fontWeight="800" fontSize="md" noOfLines={1}>{emp.name}</Text>
                        <Text fontSize="sm" color="gray.500" noOfLines={1}>{emp.email}</Text>
                        <HStack mt={2} spacing={2} flexWrap="wrap">
                            <Badge colorScheme={emp.role === 'admin' ? 'red' : emp.role === 'manager' ? 'purple' : 'blue'} borderRadius="full" px={3}>
                                {emp.role?.toUpperCase?.() || 'USER'}
                            </Badge>
                            <Badge variant="outline" borderRadius="full" px={3} textTransform="capitalize">
                                {emp.payroll?.salaryType || 'monthly'}
                            </Badge>
                        </HStack>
                    </Box>

                    <VStack align="end" spacing={2} flexShrink={0}>
                        <Text fontWeight="900" color="brand.600">₹{Number(emp.payroll?.baseSalary || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
                        <HStack spacing={2}>
                            <Tooltip label="Edit Base Salary">
                                <IconButton
                                    size="sm"
                                    aria-label="Edit salary"
                                    icon={<Edit2 size={16} />}
                                    onClick={() => openSalaryModal(emp)}
                                />
                            </Tooltip>
                            <Tooltip label="Generate Payslip">
                                <IconButton
                                    size="sm"
                                    aria-label="Generate payslip"
                                    variant="outline"
                                    colorScheme="brand"
                                    icon={<FileDown size={16} />}
                                    onClick={() => openPayslipModal(emp)}
                                />
                            </Tooltip>
                        </HStack>
                    </VStack>
                </Flex>
            </CardBody>
        </Card>
    );

    const PayslipCard = ({ slip }) => (
        <Card borderRadius="2xl" borderWidth="1px" borderColor={borderColor} overflow="hidden">
            <CardBody p={4}>
                <Flex justify="space-between" align="flex-start" gap={3}>
                    <Box minW={0}>
                        <Text fontWeight="800" noOfLines={1}>{slip.userId?.name || 'Employee'}</Text>
                        <Text fontSize="xs" color="gray.500">Month: {slip.month}</Text>
                        <HStack mt={2} spacing={2}>
                            <Badge colorScheme={slip.status === 'paid' ? 'green' : 'orange'} borderRadius="full" px={3}>
                                {String(slip.status || '').toUpperCase()}
                            </Badge>
                        </HStack>
                    </Box>
                    <VStack align="end" spacing={2} flexShrink={0}>
                        <Text fontWeight="900" color="brand.600">₹{Number(slip.netPay || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
                        {slip.status === 'draft' ? (
                            <IconButton
                                size="sm"
                                aria-label="Mark paid"
                                colorScheme="green"
                                icon={<Wallet size={16} />}
                                onClick={() => { setSelectedPayslip(slip); onPayOpen(); }}
                            />
                        ) : (
                            <Tooltip label="Payment Processed">
                                <Box color="green.500">
                                    <CheckCircle size={20} />
                                </Box>
                            </Tooltip>
                        )}
                    </VStack>
                </Flex>
            </CardBody>
        </Card>
    );


    return (
        <Box p={{ base: 0, md: 6 }}>
            <Flex justify="space-between" align={{ base: 'stretch', md: 'center' }} mb={6} direction={{ base: 'column', md: 'row' }} gap={4}>
                <Box>
                    <Heading size="lg" mb={1} color="gray.800">Payroll Management</Heading>
                    <Text color="gray.500">Manage employee salaries and monthly payslips</Text>
                </Box>
            </Flex>

            <Tabs colorScheme="brand" variant="enclosed">
                <TabList overflowX="auto" sx={{ '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none' }}>
                    <Tab><Users size={16} style={{ marginRight: '8px' }} /> Employees</Tab>
                    <Tab><FileText size={16} style={{ marginRight: '8px' }} /> Payslips</Tab>
                </TabList>

                <TabPanels>
                    {/* EMPLOYEES TAB */}
                    <TabPanel px={0}>
                        <Box bg={bg} borderRadius="2xl" borderWidth="1px" borderColor={borderColor} overflow="hidden">
                            {isMobile ? (
                                <VStack align="stretch" spacing={3} p={3}>
                                    {employees.length === 0 ? (
                                        <Text textAlign="center" py={10} color="gray.500">No employees found</Text>
                                    ) : (
                                        employees.map(emp => <EmployeeCard key={emp._id} emp={emp} />)
                                    )}
                                </VStack>
                            ) : (
                            <Box overflowX="auto">
                                <Table variant="simple" size="sm">
                                <Thead bg="gray.50">
                                    <Tr>
                                        <Th>Employee Name</Th>
                                        <Th display={{ base: 'none', md: 'table-cell' }}>Role</Th>
                                        <Th>Base Salary (₹)</Th>
                                        <Th display={{ base: 'none', md: 'table-cell' }}>Type</Th>
                                        <Th textAlign="right">Actions</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {employees.map(emp => (
                                        <Tr key={emp._id}>
                                            <Td>
                                                <Text fontWeight="bold">{emp.name}</Text>
                                                <Text fontSize="xs" color="gray.500">{emp.email}</Text>
                                                <HStack display={{ base: 'flex', md: 'none' }} mt={2} spacing={2} wrap="wrap">
                                                    <Badge colorScheme={emp.role === 'admin' ? 'red' : emp.role === 'manager' ? 'purple' : 'blue'}>
                                                        {emp.role.toUpperCase()}
                                                    </Badge>
                                                    <Badge variant="outline" textTransform="capitalize">
                                                        {emp.payroll?.salaryType || 'monthly'}
                                                    </Badge>
                                                </HStack>
                                            </Td>
                                            <Td display={{ base: 'none', md: 'table-cell' }}>
                                                <Badge colorScheme={emp.role === 'admin' ? 'red' : emp.role === 'manager' ? 'purple' : 'blue'}>{emp.role.toUpperCase()}</Badge>
                                            </Td>
                                            <Td fontWeight="bold">₹{emp.payroll?.baseSalary?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || '0.00'}</Td>
                                            <Td display={{ base: 'none', md: 'table-cell' }} textTransform="capitalize">{emp.payroll?.salaryType || 'monthly'}</Td>
                                            <Td textAlign="right">
                                                <Tooltip label="Edit Base Salary">
                                                    <IconButton size="sm" icon={<Edit2 size={16} />} mr={2} onClick={() => openSalaryModal(emp)} />
                                                </Tooltip>
                                                <Tooltip label="Generate Payslip">
                                                    <>
                                                        <Button
                                                            display={{ base: 'none', md: 'inline-flex' }}
                                                            size="sm"
                                                            colorScheme="brand"
                                                            variant="outline"
                                                            leftIcon={<FileDown size={14} />}
                                                            onClick={() => openPayslipModal(emp)}
                                                        >
                                                            Generate Slip
                                                        </Button>
                                                        <IconButton
                                                            display={{ base: 'inline-flex', md: 'none' }}
                                                            aria-label="Generate payslip"
                                                            size="sm"
                                                            variant="outline"
                                                            colorScheme="brand"
                                                            icon={<FileDown size={16} />}
                                                            onClick={() => openPayslipModal(emp)}
                                                        />
                                                    </>
                                                </Tooltip>
                                            </Td>
                                        </Tr>
                                    ))}
                                </Tbody>
                                </Table>
                            </Box>
                            )}
                        </Box>
                    </TabPanel>

                    {/* PAYSLIPS TAB */}
                    <TabPanel px={0}>
                        <Flex mb={4} justify="space-between" align={{ base: 'stretch', md: 'center' }} direction={{ base: 'column', md: 'row' }} gap={3}>
                            <HStack flexWrap="wrap">
                                <Text fontWeight="medium" color="gray.600">Select Month:</Text>
                                <Input
                                    type="month"
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    w={{ base: 'full', sm: '220px' }}
                                    bg="white"
                                />
                            </HStack>
                        </Flex>

                        <Box bg={bg} borderRadius="2xl" borderWidth="1px" borderColor={borderColor} overflow="hidden">
                            {isMobile ? (
                                <VStack align="stretch" spacing={3} p={3}>
                                    {payslips.length === 0 ? (
                                        <Text textAlign="center" py={10} color="gray.500">No payslips found for {selectedMonth}</Text>
                                    ) : (
                                        payslips.map(slip => <PayslipCard key={slip._id} slip={slip} />)
                                    )}
                                </VStack>
                            ) : (
                            <Box overflowX="auto">
                                <Table variant="simple" size="sm">
                                <Thead bg="gray.50">
                                    <Tr>
                                        <Th>Employee</Th>
                                        <Th isNumeric display={{ base: 'none', md: 'table-cell' }}>Basic Pay</Th>
                                        <Th isNumeric>Net Pay</Th>
                                        <Th>Status</Th>
                                        <Th textAlign="right">Actions</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {payslips.length === 0 ? (
                                        <Tr><Td colSpan={5} textAlign="center" py={10} color="gray.500">No payslips found for {selectedMonth}</Td></Tr>
                                    ) : (
                                        payslips.map(slip => (
                                            <Tr key={slip._id}>
                                                <Td>
                                                    <Text fontWeight="bold">{slip.userId?.name}</Text>
                                                    <Text fontSize="xs" color="gray.500">Month: {slip.month}</Text>
                                                </Td>
                                                <Td isNumeric display={{ base: 'none', md: 'table-cell' }}>₹{slip.basicPay.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Td>
                                                <Td isNumeric fontWeight="bold" color="brand.600">₹{slip.netPay.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Td>
                                                <Td>
                                                    <Badge colorScheme={slip.status === 'paid' ? 'green' : 'orange'}>
                                                        {slip.status.toUpperCase()}
                                                    </Badge>
                                                </Td>
                                                <Td textAlign="right">
                                                    {slip.status === 'draft' ? (
                                                        <Button
                                                            size="sm"
                                                            colorScheme="green"
                                                            leftIcon={<Wallet size={14} />}
                                                            onClick={() => { setSelectedPayslip(slip); onPayOpen(); }}
                                                        >
                                                            <Box as="span" display={{ base: 'none', md: 'inline' }}>Mark Paid</Box>
                                                        </Button>
                                                    ) : (
                                                        <Tooltip label="Payment Processed">
                                                            <CheckCircle color="#10B981" />
                                                        </Tooltip>
                                                    )}
                                                </Td>
                                            </Tr>
                                        ))
                                    )}
                                </Tbody>
                                </Table>
                            </Box>
                            )}
                        </Box>
                    </TabPanel>
                </TabPanels>
            </Tabs>

            {/* Update Base Salary Modal */}
            <Modal isOpen={isSalaryOpen} onClose={onSalaryClose}>
                <ModalOverlay />
                <ModalContent as="form" onSubmit={handleUpdateSalary}>
                    <ModalHeader>Update Salary</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4}>
                            <FormControl isRequired>
                                <FormLabel>Base Salary (₹)</FormLabel>
                                <NumberInput min={0}>
                                    <NumberInputField value={salaryForm.baseSalary} onChange={e => setSalaryForm({ ...salaryForm, baseSalary: Number(e.target.value) })} />
                                </NumberInput>
                            </FormControl>
                            <FormControl isRequired>
                                <FormLabel>Salary Type</FormLabel>
                                <Select value={salaryForm.salaryType} onChange={e => setSalaryForm({ ...salaryForm, salaryType: e.target.value })}>
                                    <option value="monthly">Monthly</option>
                                    <option value="hourly">Hourly</option>
                                </Select>
                            </FormControl>
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onSalaryClose}>Cancel</Button>
                        <Button colorScheme="brand" type="submit">Save Settings</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Generate Payslip Modal */}
            <Modal isOpen={isPayslipOpen} onClose={onPayslipClose}>
                <ModalOverlay />
                <ModalContent as="form" onSubmit={handleGeneratePayslip}>
                    <ModalHeader>Generate Payslip: {selectedMonth}</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Alert status="info" mb={4} borderRadius="md">
                            Generating payslip for {selectedEmp?.name} for the month of {selectedMonth}.
                        </Alert>
                        <VStack spacing={4}>
                            <FormControl isRequired>
                                <FormLabel>Basic Pay (₹)</FormLabel>
                                <NumberInput>
                                    <NumberInputField value={payslipForm.basicPay} onChange={e => setPayslipForm({ ...payslipForm, basicPay: Number(e.target.value) })} />
                                </NumberInput>
                            </FormControl>
                            <HStack w="full">
                                <FormControl>
                                    <FormLabel color="green.600">Allowances (+)</FormLabel>
                                    <NumberInput min={0}>
                                        <NumberInputField value={payslipForm.allowances} onChange={e => setPayslipForm({ ...payslipForm, allowances: Number(e.target.value) })} />
                                    </NumberInput>
                                </FormControl>
                                <FormControl>
                                    <FormLabel color="red.600">Deductions (-)</FormLabel>
                                    <NumberInput min={0}>
                                        <NumberInputField value={payslipForm.deductions} onChange={e => setPayslipForm({ ...payslipForm, deductions: Number(e.target.value) })} />
                                    </NumberInput>
                                </FormControl>
                            </HStack>
                            <FormControl>
                                <FormLabel>Notes (Optional)</FormLabel>
                                <Input value={payslipForm.notes} onChange={e => setPayslipForm({ ...payslipForm, notes: e.target.value })} placeholder="e.g. absent 2 days" />
                            </FormControl>
                        </VStack>

                        <Box mt={4} p={3} bg="gray.50" border="1px" borderColor="gray.200" borderRadius="md">
                            <Flex justify="space-between" fontWeight="bold">
                                <Text>Net Payable:</Text>
                                <Text color="brand.600">₹{(Number(payslipForm.basicPay) + Number(payslipForm.allowances) - Number(payslipForm.deductions)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
                            </Flex>
                        </Box>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onPayslipClose}>Cancel</Button>
                        <Button colorScheme="brand" type="submit">Save Draft</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Log Payment Modal */}
            <Modal isOpen={isPayOpen} onClose={onPayClose}>
                <ModalOverlay />
                <ModalContent as="form" onSubmit={handlePay}>
                    <ModalHeader>Process Payroll Payment</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        {selectedPayslip && (
                            <Box mb={4} p={3} bg="gray.50" borderRadius="md" border="1px" borderColor="gray.200">
                                <Text fontWeight="bold">Pay {selectedPayslip.userId?.name}</Text>
                                <Text fontSize="sm" color="gray.500">Net Pay: ₹{selectedPayslip.netPay}</Text>
                            </Box>
                        )}
                        <VStack spacing={4}>
                            <FormControl isRequired>
                                <FormLabel>Payment Method</FormLabel>
                                <Select value={paymentForm.paymentMethod} onChange={e => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}>
                                    <option value="bank_transfer">Bank Transfer</option>
                                    <option value="cash">Cash</option>
                                    <option value="cheque">Cheque</option>
                                    <option value="upi">UPI</option>
                                </Select>
                            </FormControl>
                            <Text fontSize="xs" color="gray.500">
                                Marking this as paid will automatically log a ₹{selectedPayslip?.netPay} expense on the dashboard.
                            </Text>
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onPayClose}>Cancel</Button>
                        <Button colorScheme="green" type="submit">Confirm Payment</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

        </Box>
    );
}
