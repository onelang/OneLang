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

sub getResult {
    my ( $self ) = @_;
    return 1;
}

sub testMethod {
    my ( $self ) = @_;
    print(($self->getResult() ? "true" : "false") . "\n");
}

package Program;
my $c = new TestClass();
$c->testMethod();