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

sub method_test {
    my ( $self, $method_param ) = @_;
}

sub test_method {
    my ( $self ) = @_;
}

package Program;

eval {
    my $c = new TestClass();
    $c->test_method();
};
if ($@) {
    print "Exception: " . $@
}