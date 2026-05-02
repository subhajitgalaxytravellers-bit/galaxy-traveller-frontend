export async function getTimelineData() {
  // Simulate backend latency
  // await new Promise((resolve) => setTimeout(resolve, 500));

  return [
    {
      year: '2009',
      title: 'The Beginning',
      description:
        'Started as a small agency with a passion for adventure and cultural exploration.',
    },
    {
      year: '2012',
      title: 'Global Expansion',
      description: 'Expanded operations to 50+ countries across 5 continents.',
    },
    {
      year: '2016',
      title: 'Digital Innovation',
      description:
        'Launched our online platform, making travel planning accessible to everyone.',
    },
    {
      year: '2020',
      title: 'Sustainable Tourism',
      description:
        'Committed to eco-friendly travel practices and long-term environmental responsibility.',
    },
    {
      year: '2024',
      title: '50,000+ Travelers',
      description: 'Celebrated a major milestone in unforgettable journeys.',
    },
  ];
}
