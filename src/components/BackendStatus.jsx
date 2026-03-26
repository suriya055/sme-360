import React from 'react';
import { Badge, HStack, Text } from '@chakra-ui/react';
import { Server, Wifi, WifiOff } from 'lucide-react';
import { useApp } from '../hooks/useApp';

const BackendStatus = () => {
  const { useBackendAPI } = useApp();
  
  return (
    <HStack spacing={2}>
      <Server size={16} />
      <Text fontSize="sm">Backend:</Text>
      <Badge 
        colorScheme={useBackendAPI ? 'green' : 'orange'}
        variant="subtle"
      >
        <HStack spacing={1}>
          {useBackendAPI ? <Wifi size={12} /> : <WifiOff size={12} />}
          <Text>{useBackendAPI ? 'Connected' : 'Local Storage'}</Text>
        </HStack>
      </Badge>
    </HStack>
  );
};

export default BackendStatus;
