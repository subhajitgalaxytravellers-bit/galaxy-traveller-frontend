import React from 'react';
import { Button } from '../ui/button';
import Link from 'next/link';

const CTA = () => {
  return (
    <section className='py-20 px-4 bg-primary text-primary-foreground'>
      <div className='container mx-auto text-center'>
        <h2 className='text-4xl font-bold mb-6'>
          Ready to Start Your Journey?
        </h2>
        <p className='text-xl mb-8 opacity-90 max-w-2xl mx-auto'>
          Let us help you plan the adventure of a lifetime. Get in touch with
          our expert team today.
        </p>
        <Link href='/contact'>
          <Button
            size='lg'
            variant='outline'
            className='text-lg text-primary hover:bg-accent-foreground hover:text-primary px-8 py-6'>
            Contact Us Today
          </Button>
        </Link>
      </div>
    </section>
  );
};

export default CTA;
