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

sub methodTest {
    my ( $self, $method_param ) = @_;
}

sub testMethod {
    my ( $self ) = @_;
}

package Program;

eval {
    my $c = new TestClass();
    $c->testMethod();
};
if ($@) {
    print "Exception: " . $@
}