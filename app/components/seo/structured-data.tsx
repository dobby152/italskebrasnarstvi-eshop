import Script from 'next/script'

interface StructuredDataProps {
  data: object | object[]
}

export function StructuredData({ data }: StructuredDataProps) {
  const jsonLdData = Array.isArray(data) ? data : [data]
  
  return (
    <>
      {jsonLdData.map((item, index) => (
        <Script
          key={index}
          id={`structured-data-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(item, null, process.env.NODE_ENV === 'development' ? 2 : 0)
          }}
        />
      ))}
    </>
  )
}