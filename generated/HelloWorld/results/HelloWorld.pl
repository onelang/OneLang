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
    print(("Hello world!") . "\n");
}

package Program;
my $c = new TestClass();
$c->testMethod();