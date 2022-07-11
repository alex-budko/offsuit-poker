import { CircularProgress } from '@chakra-ui/react'

import React from 'react'

export default function Loading() {
  return (
    <CircularProgress isIndeterminate color='green.300' />
  )
}

