import React from 'react';
import { Flex, Spinner } from '@chakra-ui/react';

const LoadingSpinner = ({ size = "xl", color = "brand.500", fullScreen = true }) => {
  if (fullScreen) {
    return (
      <Flex 
        position="fixed" 
        top={0} 
        left={0} 
        right={0} 
        bottom={0} 
        align="center" 
        justify="center"
        bg="whiteAlpha.800"
        zIndex={9999}
      >
        <Spinner size={size} color={color} thickness="4px" />
      </Flex>
    );
  }

  return (
    <Flex align="center" justify="center" p={8}>
      <Spinner size={size} color={color} thickness="4px" />
    </Flex>
  );
};

export default LoadingSpinner;
