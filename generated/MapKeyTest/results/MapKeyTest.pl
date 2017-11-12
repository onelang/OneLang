use strict;
use warnings;

package TestClass;

sub new
{
    my $class = shift;
    my $self = {};
    bless $self, $class;
    
    return $self;
}

sub testMethod {
    my ( $self ) = @_;
    my %map = (
      
    );
    my @keys = keys %map;
}

package Program;
my $c = new TestClass();
$c->testMethod();