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
    print "Hello World!\n";
}

package Program;
my $c = new TestClass();
$c->testMethod()
