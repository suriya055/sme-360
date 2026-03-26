import React, { useState, useEffect } from 'react';
import {
    Box, Flex, Text, Heading, Button, Table, Thead, Tbody, Tr, Th, Td, Badge,
    useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton,
    ModalBody, ModalFooter, FormControl, FormLabel, Input, Select, VStack, HStack,
    useColorModeValue, IconButton, Tooltip, Stepper, Step, StepIndicator, StepStatus,
    StepIcon, StepNumber, StepTitle, StepDescription, StepSeparator, useBreakpointValue
} from '@chakra-ui/react';
import { UploadCloud, CheckCircle, AlertTriangle, Link as LinkIcon, PlusCircle, Save } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const steps = [
    { title: 'Upload', description: 'Bank Statement CSV' },
    { title: 'Map Columns', description: 'Define data fields' },
    { title: 'Reconcile', description: 'Match transactions' },
    { title: 'Complete', description: 'Save report' }
];

export default function BankReconciliation() {
    const [activeStep, setActiveStep] = useState(0);
    const stepperOrientation = useBreakpointValue({ base: 'vertical', md: 'horizontal' }) || 'horizontal';
    const showStepDescriptions = useBreakpointValue({ base: false, md: true }) ?? true;

    // States
    const [file, setFile] = useState(null);
    const [rawCsvData, setRawCsvData] = useState([]);
    const [mappedTransactions, setMappedTransactions] = useState([]);

    // Mapping Config
    const [mapping, setMapping] = useState({
        date: '',
        description: '',
        type: '',
        amount: ''
    });

    const bg = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');

    // Step 1: Upload File
    const handleFileUpload = async (e) => {
        e.preventDefault();
        if (!file) return toast.error('Please select a CSV file');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const { data } = await api.post('/reconciliation/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setRawCsvData(data.data);
            toast.success('File parsed successfully');
            setActiveStep(1);
        } catch (err) {
            toast.error('Failed to parse CSV');
        }
    };

    // Step 2: Map Columns and format data
    const handleMappingSubmit = async () => {
        // Validate mapping
        if (!mapping.date || !mapping.description || !mapping.amount) {
            return toast.error('Please map Date, Description, and Amount columns');
        }

        try {
            // Format the data arrays based on user mapping
            const formattedData = rawCsvData.map(row => {
                let type = 'debit';
                // If they mapped a Type column, attempt to read it
                if (mapping.type && row[mapping.type]) {
                    const val = row[mapping.type].toLowerCase();
                    if (val.includes('cr') || val.includes('credit') || val.includes('deposit')) type = 'credit';
                } else {
                    // Alternatively, infer from amount if negative
                    if (Number(row[mapping.amount]) > 0) type = 'credit';
                    else type = 'debit';
                }

                return {
                    date: row[mapping.date],
                    description: row[mapping.description],
                    type,
                    amount: Math.abs(Number(row[mapping.amount]))
                };
            }).filter(row => !isNaN(row.amount) && row.amount > 0); // Ignore pure text rows

            // Send to backend for matching engine
            const { data } = await api.post('/reconciliation/analyze', { transactions: formattedData });
            setMappedTransactions(data.analyzedTransactions);
            setActiveStep(2);
            toast.success('Transactions Analyzed');

        } catch (err) {
            toast.error('Failed to analyze mapping');
            console.error(err);
        }
    };

    // Step 3: Save final report
    const handleSaveReport = async () => {
        try {
            await api.post('/reconciliation/save', {
                month: format(new Date(), 'yyyy-MM'),
                statementDate: new Date(),
                status: 'completed',
                transactions: mappedTransactions
            });
            toast.success('Reconciliation Report Saved!');
            setActiveStep(3);
        } catch (err) {
            toast.error('Failed to save report');
        }
    };

    return (
        <Box p={{ base: 0, md: 6 }}>
            <Flex justify="space-between" align={{ base: 'stretch', md: 'center' }} mb={6} direction={{ base: 'column', md: 'row' }} gap={4}>
                <Box>
                    <Heading size="lg" mb={1} color="gray.800">Bank Reconciliation</Heading>
                    <Text color="gray.500">Sync your bank statements with system transactions</Text>
                </Box>
            </Flex>

            {/* Stepper */}
            <Box mb={{ base: 6, md: 10 }}>
                <Stepper index={activeStep} colorScheme="brand" orientation={stepperOrientation} gap={{ base: 3, md: 0 }}>
                    {steps.map((step, index) => (
                        <Step key={index}>
                            <StepIndicator>
                                <StepStatus
                                    complete={<StepIcon />}
                                    incomplete={<StepNumber />}
                                    active={<StepNumber />}
                                />
                            </StepIndicator>
                            <Box flexShrink="0" minW={{ base: '0', md: 'auto' }}>
                                <StepTitle fontSize={{ base: 'sm', md: 'md' }} lineHeight="short" noOfLines={{ base: 1, md: 2 }}>
                                    {step.title}
                                </StepTitle>
                                {showStepDescriptions && (
                                    <StepDescription fontSize={{ base: 'xs', md: 'sm' }} color="gray.500" noOfLines={2}>
                                        {step.description}
                                    </StepDescription>
                                )}
                            </Box>
                            <StepSeparator />
                        </Step>
                    ))}
                </Stepper>
            </Box>

            {/* View 1: Upload */}
            {activeStep === 0 && (
                <Box bg={bg} p={{ base: 6, md: 10 }} borderRadius="2xl" borderWidth="1px" borderColor={borderColor} textAlign="center">
                    <UploadCloud size={64} color="#94a3b8" style={{ margin: '0 auto', marginBottom: '16px' }} />
                    <Heading size="md" mb={2}>Upload Bank Statement</Heading>
                    <Text color="gray.500" mb={6}>Only .csv files are supported. Ensure the file contains Date, Description, and Amount columns.</Text>
                    <Input type="file" accept=".csv" onChange={(e) => setFile(e.target.files[0])} maxW={{ base: '100%', sm: '360px' }} mb={4} />
                    <br />
                    <Button colorScheme="brand" onClick={handleFileUpload}>Parse Report</Button>
                </Box>
            )}

            {/* View 2: Mapping UI */}
            {activeStep === 1 && rawCsvData.length > 0 && (
                <Box bg={bg} p={6} borderRadius="2xl" borderWidth="1px" borderColor={borderColor}>
                    <Heading size="md" mb={4}>Map CSV Columns</Heading>
                    <Text color="gray.500" mb={6}>Please tell us which column matches our system fields.</Text>

                    <HStack spacing={4} mb={8} align="flex-end" flexWrap="wrap">
                        <FormControl isRequired flex="1" minW={{ base: '100%', md: '220px' }}>
                            <FormLabel>Date Column</FormLabel>
                            <Select placeholder="Select Column" value={mapping.date} onChange={e => setMapping({ ...mapping, date: e.target.value })}>
                                {Object.keys(rawCsvData[0]).map(k => <option key={k} value={k}>{k}</option>)}
                            </Select>
                        </FormControl>
                        <FormControl isRequired flex="1" minW={{ base: '100%', md: '220px' }}>
                            <FormLabel>Description Column</FormLabel>
                            <Select placeholder="Select Column" value={mapping.description} onChange={e => setMapping({ ...mapping, description: e.target.value })}>
                                {Object.keys(rawCsvData[0]).map(k => <option key={k} value={k}>{k}</option>)}
                            </Select>
                        </FormControl>
                        <FormControl flex="1" minW={{ base: '100%', md: '220px' }}>
                            <FormLabel>Type (CR/DR) Optional</FormLabel>
                            <Select placeholder="Select Column" value={mapping.type} onChange={e => setMapping({ ...mapping, type: e.target.value })}>
                                {Object.keys(rawCsvData[0]).map(k => <option key={k} value={k}>{k}</option>)}
                            </Select>
                        </FormControl>
                        <FormControl isRequired flex="1" minW={{ base: '100%', md: '220px' }}>
                            <FormLabel>Amount Column</FormLabel>
                            <Select placeholder="Select Column" value={mapping.amount} onChange={e => setMapping({ ...mapping, amount: e.target.value })}>
                                {Object.keys(rawCsvData[0]).map(k => <option key={k} value={k}>{k}</option>)}
                            </Select>
                        </FormControl>
                        <Button colorScheme="brand" onClick={handleMappingSubmit} w={{ base: '100%', md: 'auto' }}>
                            Analyze Matches
                        </Button>
                    </HStack>

                    <Text fontWeight="bold" mb={2}>Data Preview (First 3 Rows):</Text>
                    <Box overflowX="auto">
                        <Table variant="simple" size="sm">
                            <Thead bg="gray.100">
                                <Tr>
                                    {Object.keys(rawCsvData[0]).map(k => <Th key={k}>{k}</Th>)}
                                </Tr>
                            </Thead>
                            <Tbody>
                                {rawCsvData.slice(0, 3).map((row, i) => (
                                    <Tr key={i}>
                                        {Object.values(row).map((val, idx) => <Td key={idx}>{val}</Td>)}
                                    </Tr>
                                ))}
                            </Tbody>
                        </Table>
                    </Box>
                </Box>
            )}

            {/* View 3: Reconcile View */}
            {activeStep === 2 && (
                <Box>
                    <Flex justify="space-between" mb={4} direction={{ base: 'column', md: 'row' }} gap={3} align={{ base: 'stretch', md: 'center' }}>
                        <Heading size="md">Match Results</Heading>
                        <Button colorScheme="green" leftIcon={<Save size={16} />} onClick={handleSaveReport} w={{ base: 'full', md: 'auto' }}>
                            Finalize Report
                        </Button>
                    </Flex>

                    <Box bg={bg} borderRadius="2xl" borderWidth="1px" borderColor={borderColor} overflow="hidden">
                        <Box overflowX="auto">
                            <Table variant="simple" size="sm">
                            <Thead bg="gray.50">
                                <Tr>
                                    <Th>Bank Date</Th>
                                    <Th>Description</Th>
                                    <Th isNumeric>Amount</Th>
                                    <Th display={{ base: 'none', md: 'table-cell' }}>Type</Th>
                                    <Th>Status</Th>
                                    <Th display={{ base: 'none', md: 'table-cell' }}>System Match</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {mappedTransactions.map((tx, idx) => (
                                    <Tr key={idx} bg={tx.matchStatus === 'matched' ? 'green.50' : 'red.50'}>
                                        <Td>{format(new Date(tx.date), 'dd MMM yyyy')}</Td>
                                        <Td>{tx.description}</Td>
                                        <Td isNumeric fontWeight="bold">₹{tx.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Td>
                                        <Td display={{ base: 'none', md: 'table-cell' }}><Badge colorScheme={tx.type === 'credit' ? 'green' : 'orange'}>{tx.type.toUpperCase()}</Badge></Td>
                                        <Td>
                                            {tx.matchStatus === 'matched' ? (
                                                <HStack color="green.600"><CheckCircle size={16} /> <Text fontSize="sm" fontWeight="bold">Matched</Text></HStack>
                                            ) : (
                                                <HStack color="red.500"><AlertTriangle size={16} /> <Text fontSize="sm" fontWeight="bold">Missing</Text></HStack>
                                            )}
                                        </Td>
                                        <Td display={{ base: 'none', md: 'table-cell' }}>
                                            {tx.matchStatus === 'matched' ? (
                                                <Badge colorScheme="brand">{tx.linkedRecordType}</Badge>
                                            ) : (
                                                <Button size="xs" colorScheme="gray" leftIcon={<PlusCircle size={12} />}>Create Entry</Button>
                                            )}
                                        </Td>
                                    </Tr>
                                ))}
                            </Tbody>
                            </Table>
                        </Box>
                    </Box>
                </Box>
            )}

            {/* View 4: Complete */}
            {activeStep === 3 && (
                <Box bg={bg} p={{ base: 6, md: 10 }} borderRadius="2xl" borderWidth="1px" borderColor={borderColor} textAlign="center">
                    <CheckCircle size={64} color="#10B981" style={{ margin: '0 auto', marginBottom: '16px' }} />
                    <Heading size="md" mb={2}>Reconciliation Complete!</Heading>
                    <Text color="gray.500" mb={6}>Your bank statement has been successfully synchronized and saved to the audit log.</Text>
                    <Button colorScheme="brand" variant="outline" onClick={() => { setActiveStep(0); setRawCsvData([]); setFile(null); }}>Start Another Review</Button>
                </Box>
            )}
        </Box>
    );
}
